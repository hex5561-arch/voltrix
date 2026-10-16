/**
 * WhatsApp Cloud API Webhook and Media Gateway for Voltrix OS
 *
 * Handles:
 * 1. Webhook Challenge Verification (GET hub.mode === 'subscribe')
 * 2. Incoming Event Ingestion (POST text and voice/audio messages)
 * 3. Media Extraction:
 *    - Queries Graph API for media URL (GET /v21.0/<media_id>)
 *    - Downloads binary stream with Bearer authorization
 *    - Saves audio to R2 bucket under hf-videos/whatsapp-<id>.<ext>
 *    - Transcribes audio via Workers AI / Groq / OpenAI Whisper ASR
 * 4. Outbound Messaging Gateway (POST /v21.0/<phone_number_id>/messages)
 */

export interface WhatsAppEnv {
  WHATSAPP_VERIFY_TOKEN?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  BLUEPRINT_CONTENT?: R2Bucket;
  WORKERS_AI?: any;
  AI?: any;
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  CF_AI_GATEWAY?: string;
  CF_AI_GATEWAY_ACCOUNT_ID?: string;
  ASR_ENGINE?: (audioBuffer: ArrayBuffer, mimeType: string, env: WhatsAppEnv) => Promise<string>;
}

export interface WhatsAppIncomingTextMessage {
  body: string;
}

export interface WhatsAppIncomingMediaMessage {
  id: string;
  mime_type: string;
}

export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: WhatsAppIncomingTextMessage;
  audio?: WhatsAppIncomingMediaMessage;
  voice?: WhatsAppIncomingMediaMessage;
  [key: string]: unknown;
}

export interface WhatsAppWebhookChangeValue {
  messaging_product?: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: Array<{
    profile?: { name?: string };
    wa_id?: string;
  }>;
  messages?: WhatsAppWebhookMessage[];
  statuses?: unknown[];
}

export interface WhatsAppWebhookChange {
  field?: string;
  value?: WhatsAppWebhookChangeValue;
}

export interface WhatsAppWebhookEntry {
  id?: string;
  changes?: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
}

export interface ProcessedWhatsAppMessage {
  id: string;
  from: string;
  type: string;
  timestamp: string;
  text?: string;
  mediaId?: string;
  mimeType?: string;
  r2Key?: string;
  transcription?: string;
  error?: string;
}

/**
 * Maps audio MIME types to canonical file extensions.
 */
export function getExtensionFromMimeType(mimeType?: string): string {
  if (!mimeType) return "ogg";
  const clean = mimeType.split(";")[0].trim().toLowerCase();
  switch (clean) {
    case "audio/ogg":
    case "audio/opus":
      return "ogg";
    case "audio/mpeg":
    case "audio/mp3":
      return "mp3";
    case "audio/wav":
    case "audio/x-wav":
      return "wav";
    case "audio/m4a":
    case "audio/mp4":
    case "audio/x-m4a":
      return "m4a";
    case "audio/aac":
      return "aac";
    case "audio/amr":
      return "amr";
    default:
      return "ogg";
  }
}

/**
 * Challenge Verification Handler (GET /api/webhooks/whatsapp)
 *
 * Meta calls this with:
 * - hub.mode = "subscribe"
 * - hub.verify_token = env.WHATSAPP_VERIFY_TOKEN
 * - hub.challenge = <random challenge token>
 *
 * Returns 200 with challenge on match, 403 on mismatch.
 */
export async function handleWhatsAppWebhookGet(
  req: Request,
  env: WhatsAppEnv
): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expectedToken = env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expectedToken && token === expectedToken) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", {
    status: 403,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Downloads media binary stream from WhatsApp Graph API.
 */
export async function fetchWhatsAppMedia(
  mediaId: string,
  accessToken: string
): Promise<{ buffer: ArrayBuffer; mimeType: string; url: string }> {
  // Step 1: Query media metadata to get download URL
  const metaUrl = `https://graph.facebook.com/v21.0/${mediaId}`;
  const metaRes = await fetch(metaUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!metaRes.ok) {
    const errorText = await metaRes.text().catch(() => "");
    throw new Error(`Failed to query WhatsApp media URL (${metaRes.status}): ${errorText}`);
  }

  const metaData = (await metaRes.json()) as { url?: string; mime_type?: string };
  if (!metaData.url) {
    throw new Error("WhatsApp media metadata did not contain a download URL");
  }

  // Step 2: Fetch audio binary stream with Bearer authorization
  const mediaRes = await fetch(metaData.url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!mediaRes.ok) {
    const errorText = await mediaRes.text().catch(() => "");
    throw new Error(`Failed to download WhatsApp media binary (${mediaRes.status}): ${errorText}`);
  }

  const buffer = await mediaRes.arrayBuffer();
  return {
    buffer,
    mimeType: metaData.mime_type || "audio/ogg",
    url: metaData.url,
  };
}

/**
 * Persists audio to R2 bucket under `hf-videos/whatsapp-<id>.<ext>`
 */
export async function saveAudioToR2(
  bucket: R2Bucket,
  mediaId: string,
  mimeType: string,
  buffer: ArrayBuffer
): Promise<string> {
  const ext = getExtensionFromMimeType(mimeType);
  const r2Key = `hf-videos/whatsapp-${mediaId}.${ext}`;
  await bucket.put(r2Key, buffer, {
    httpMetadata: {
      contentType: mimeType,
    },
  });
  return r2Key;
}

/**
 * Calls ASR engine to transcribe voice notes.
 * Supports:
 * 1. Custom ASR engine provided in env.ASR_ENGINE
 * 2. Cloudflare Workers AI (@cf/openai/whisper)
 * 3. Groq Whisper (via AI Gateway or direct API)
 * 4. OpenAI Whisper (via AI Gateway or direct API)
 */
export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  env: WhatsAppEnv
): Promise<string> {
  if (typeof env.ASR_ENGINE === "function") {
    return await env.ASR_ENGINE(audioBuffer, mimeType, env);
  }

  // 1. Cloudflare Workers AI
  const ai = env.WORKERS_AI || (env as any).AI;
  if (ai && typeof ai.run === "function") {
    try {
      const response = await ai.run("@cf/openai/whisper", {
        audio: [...new Uint8Array(audioBuffer)],
      });
      if (response && typeof response === "object" && typeof response.text === "string") {
        return response.text.trim();
      }
    } catch (err) {
      console.warn("Workers AI Whisper transcription error:", err);
    }
  }

  // 2. Groq Whisper
  if (env.GROQ_API_KEY) {
    try {
      const endpoint =
        env.CF_AI_GATEWAY && env.CF_AI_GATEWAY_ACCOUNT_ID
          ? `https://gateway.ai.cloudflare.com/v1/${env.CF_AI_GATEWAY_ACCOUNT_ID}/${env.CF_AI_GATEWAY}/groq/audio/transcriptions`
          : "https://api.groq.com/openai/v1/audio/transcriptions";

      const ext = getExtensionFromMimeType(mimeType);
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: mimeType });
      formData.append("file", blob, `whatsapp-audio.${ext}`);
      formData.append("model", "whisper-large-v3");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        if (data?.text) {
          return data.text.trim();
        }
      }
    } catch (err) {
      console.warn("Groq Whisper transcription error:", err);
    }
  }

  // 3. OpenAI Whisper
  if (env.OPENAI_API_KEY) {
    try {
      const endpoint =
        env.CF_AI_GATEWAY && env.CF_AI_GATEWAY_ACCOUNT_ID
          ? `https://gateway.ai.cloudflare.com/v1/${env.CF_AI_GATEWAY_ACCOUNT_ID}/${env.CF_AI_GATEWAY}/openai/audio/transcriptions`
          : "https://api.openai.com/v1/audio/transcriptions";

      const ext = getExtensionFromMimeType(mimeType);
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: mimeType });
      formData.append("file", blob, `whatsapp-audio.${ext}`);
      formData.append("model", "whisper-1");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        if (data?.text) {
          return data.text.trim();
        }
      }
    } catch (err) {
      console.warn("OpenAI Whisper transcription error:", err);
    }
  }

  return "";
}

/**
 * Builds the outbound text message payload expected by WhatsApp Graph API.
 */
export function createWhatsAppTextMessagePayload(to: string, text: string) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: text,
    },
  };
}

/**
 * Sends a WhatsApp text message via Meta Graph API
 * POST https://graph.facebook.com/v21.0/<env.WHATSAPP_PHONE_NUMBER_ID>/messages
 */
export async function sendWhatsAppMessage(
  to: string,
  text: string,
  env: WhatsAppEnv
): Promise<boolean> {
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.error("Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN");
    return false;
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const payload = createWhatsAppTextMessagePayload(to, text);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`WhatsApp send failed (${res.status}): ${errText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return false;
  }
}

/**
 * Incoming Webhook Handler (POST /api/webhooks/whatsapp)
 *
 * Parses incoming WhatsApp Cloud API events:
 * - text messages
 * - voice / audio messages
 */
export async function handleWhatsAppWebhookPost(
  req: Request,
  env: WhatsAppEnv
): Promise<Response> {
  let payload: WhatsAppWebhookPayload;
  try {
    payload = (await req.json()) as WhatsAppWebhookPayload;
  } catch (err: any) {
    return Response.json(
      { error: "Invalid JSON payload", details: err?.message },
      { status: 400 }
    );
  }

  const processedMessages: ProcessedWhatsAppMessage[] = [];

  if (payload && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      if (!Array.isArray(entry.changes)) continue;
      for (const change of entry.changes) {
        const value = change.value;
        if (!value || !Array.isArray(value.messages)) continue;

        for (const message of value.messages) {
          const { id, from, timestamp, type } = message;

          if (type === "text" && message.text) {
            const body = message.text.body;
            processedMessages.push({
              id,
              from,
              type: "text",
              timestamp,
              text: body,
            });
          } else if (type === "audio" || type === "voice") {
            const audioObj = message.audio || message.voice;
            if (!audioObj || !audioObj.id) {
              processedMessages.push({
                id,
                from,
                type,
                timestamp,
                error: "Missing audio or voice object id",
              });
              continue;
            }

            const mediaId = audioObj.id;
            const mimeType = audioObj.mime_type || "audio/ogg";

            try {
              if (!env.WHATSAPP_ACCESS_TOKEN) {
                throw new Error("WHATSAPP_ACCESS_TOKEN is not configured");
              }

              // 1. Query media URL & fetch binary stream
              const media = await fetchWhatsAppMedia(mediaId, env.WHATSAPP_ACCESS_TOKEN);
              const effectiveMimeType = media.mimeType || mimeType;

              // 2. Persist to R2 under hf-videos/whatsapp-<id>.<ext>
              let r2Key: string | undefined;
              if (env.BLUEPRINT_CONTENT) {
                r2Key = await saveAudioToR2(
                  env.BLUEPRINT_CONTENT,
                  mediaId,
                  effectiveMimeType,
                  media.buffer
                );
              }

              // 3. Transcribe audio via ASR engine
              const transcription = await transcribeAudio(
                media.buffer,
                effectiveMimeType,
                env
              );

              processedMessages.push({
                id,
                from,
                type,
                timestamp,
                mediaId,
                mimeType: effectiveMimeType,
                r2Key,
                transcription,
              });
            } catch (mediaErr: any) {
              console.error(`Error processing WhatsApp audio ${mediaId}:`, mediaErr);
              processedMessages.push({
                id,
                from,
                type,
                timestamp,
                mediaId,
                mimeType,
                error: mediaErr?.message || String(mediaErr),
              });
            }
          } else {
            // Other unhandled message types (image, video, document, etc.)
            processedMessages.push({
              id,
              from,
              type,
              timestamp,
            });
          }
        }
      }
    }
  }

  return Response.json(
    {
      status: "ok",
      processed: processedMessages.length,
      results: processedMessages,
    },
    { status: 200 }
  );
}
