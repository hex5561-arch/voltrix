/**
 * Voltrix OS Neural Image Generation Engine
 *
 * Powers image generation using Cloudflare Workers AI with fallback handling across:
 * 1. `@cf/black-forest-labs/flux-1-schnell` (12B rectified flow, 4-step fast generation, Base64 JSON output)
 * 2. `@cf/stabilityai/stable-diffusion-xl-base-1.0` (SDXL, raw binary ReadableStream output)
 *
 * Persists generated images to Cloudflare R2 ('voltrix-workshop-blueprint-content')
 * and generates durable public URLs served via https://voltrix.stream/api/hf-videos/<filename>
 */

export interface GenerateImageOptions {
  /** The text prompt describing the image to generate */
  prompt: string;
  /** Target model ID. Defaults to "@cf/black-forest-labs/flux-1-schnell" */
  model?: "@cf/black-forest-labs/flux-1-schnell" | "@cf/stabilityai/stable-diffusion-xl-base-1.0" | string;
  /** Optional custom filename or slug without extension */
  filename?: string;
  /** Diffusion steps (Flux Schnell: 4-8, default 4; SDXL: 20-50) */
  steps?: number;
  /** Guidance scale (primarily for SDXL) */
  guidance?: number;
  /** Desired image width (primarily for SDXL) */
  width?: number;
  /** Desired image height (primarily for SDXL) */
  height?: number;
  /** Random seed for deterministic generation */
  seed?: number;
}

export interface GenerateImageResult {
  ok: boolean;
  imageUrl: string;
  relativeUrl: string;
  filename: string;
  r2Key: string;
  model: string;
  prompt: string;
  byteSize: number;
  contentType: string;
  markdownEmbed: string;
  htmlEmbed: string;
}

export interface ImageEngineEnv {
  BLUEPRINT_CONTENT: R2Bucket;
  WORKERS_AI?: any;
  CF_AI_GATEWAY?: string;
  CF_AI_GATEWAY_ACCOUNT_ID?: string;
}

/**
 * Normalizes any Cloudflare Workers AI image response format
 * (Base64 string { image: "..." }, ReadableStream<Uint8Array>, ArrayBuffer, or Uint8Array)
 * into a single unified Uint8Array binary buffer.
 */
export async function normalizeImageOutput(aiRes: any): Promise<Uint8Array> {
  if (!aiRes) {
    throw new Error("Workers AI returned an empty or null response.");
  }

  // 1. Direct Uint8Array
  if (aiRes instanceof Uint8Array) {
    return aiRes;
  }

  // 2. Raw ArrayBuffer
  if (aiRes instanceof ArrayBuffer) {
    return new Uint8Array(aiRes);
  }

  // 3. FLUX Schnell JSON output format: { image: "<base64>" }
  if (typeof aiRes === "object" && aiRes !== null && "image" in aiRes && typeof aiRes.image === "string") {
    return decodeBase64ToUint8Array(aiRes.image);
  }

  // 4. Workers AI REST envelope or gateway output format: { result: { image: "<base64>" } }
  if (
    typeof aiRes === "object" &&
    aiRes !== null &&
    "result" in aiRes &&
    aiRes.result &&
    typeof aiRes.result.image === "string"
  ) {
    return decodeBase64ToUint8Array(aiRes.result.image);
  }

  // 5. SDXL binary stream: ReadableStream<Uint8Array> or stream-like object
  if (
    aiRes instanceof ReadableStream ||
    (typeof aiRes === "object" && aiRes !== null && typeof (aiRes as any).getReader === "function")
  ) {
    const ab = await new Response(aiRes as ReadableStream).arrayBuffer();
    return new Uint8Array(ab);
  }

  // 6. Generic fallback: attempt Response body arrayBuffer extraction
  try {
    const ab = await new Response(aiRes).arrayBuffer();
    return new Uint8Array(ab);
  } catch {
    throw new Error(`Unsupported Workers AI image output format: ${typeof aiRes}`);
  }
}

/**
 * Decodes a base64 string to a Uint8Array safely across Node.js and Cloudflare Workers (workerd) runtimes.
 */
function decodeBase64ToUint8Array(base64Str: string): Uint8Array {
  // Strip optional data URI scheme prefix if present
  const cleaned = base64Str.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "").trim();

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(cleaned, "base64"));
  }

  const binaryString = atob(cleaned);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates an image using Cloudflare Workers AI and stores it in R2 edge storage.
 */
export async function generateImage(
  options: GenerateImageOptions,
  env: ImageEngineEnv
): Promise<GenerateImageResult> {
  const { prompt, steps, guidance, width, height, seed } = options;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Image prompt is required.");
  }

  const bucket = env.BLUEPRINT_CONTENT;
  if (!bucket) {
    throw new Error("Durable edge storage bucket (env.BLUEPRINT_CONTENT) is not configured.");
  }

  const ai = env.WORKERS_AI;
  if (!ai) {
    throw new Error("Workers AI binding (env.WORKERS_AI) is not configured on this instance.");
  }

  const model = options.model || "@cf/black-forest-labs/flux-1-schnell";

  // Build model inputs tailored to the target model
  let inputPayload: Record<string, any>;
  if (model.includes("flux-1-schnell")) {
    inputPayload = {
      prompt: prompt.trim(),
      steps: steps ?? 4, // Flux Schnell runs optimally in 4 steps (range: 4 - 8)
      ...(seed !== undefined ? { seed } : {}),
    };
  } else if (model.includes("stable-diffusion")) {
    inputPayload = {
      prompt: prompt.trim(),
      ...(steps !== undefined ? { num_steps: steps } : {}),
      ...(guidance !== undefined ? { guidance } : {}),
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
      ...(seed !== undefined ? { seed } : {}),
    };
  } else {
    inputPayload = {
      prompt: prompt.trim(),
      ...(steps !== undefined ? { steps, num_steps: steps } : {}),
      ...(seed !== undefined ? { seed } : {}),
    };
  }

  // Execute inference on Cloudflare Workers AI
  let rawAiResponse: any;
  try {
    rawAiResponse = await ai.run(model, inputPayload);
  } catch (err: any) {
    // If FLUX Schnell encounters a rate limit or transient error, attempt fallback to SDXL
    if (model === "@cf/black-forest-labs/flux-1-schnell") {
      try {
        console.warn(`[ImageEngine] Flux Schnell failed (${err.message}). Falling back to SDXL...`);
        rawAiResponse = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
          prompt: prompt.trim(),
        });
      } catch (fallbackErr: any) {
        throw new Error(
          `Image generation failed with ${model}: ${err.message}. SDXL fallback also failed: ${fallbackErr.message}`
        );
      }
    } else {
      throw new Error(`Image generation failed with ${model}: ${err.message}`);
    }
  }

  // Normalize binary output into Uint8Array
  const imageBytes = await normalizeImageOutput(rawAiResponse);
  if (!imageBytes || imageBytes.byteLength === 0) {
    throw new Error("Workers AI returned zero-byte image data.");
  }

  // Generate safe sanitized filename
  let baseName = (options.filename || "").trim();
  if (!baseName) {
    const slug = prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 36);
    const randSuffix = Math.random().toString(36).substring(2, 8);
    baseName = `${slug || "image"}-${randSuffix}`;
  }
  baseName = baseName.replace(/\.png$/i, "").replace(/[^a-zA-Z0-9_-]/g, "-");
  const targetFile = `${baseName}.png`;
  const r2Key = `hf-videos/${targetFile}`;

  // Persist into R2 edge bucket
  await bucket.put(r2Key, imageBytes, {
    httpMetadata: {
      contentType: "image/png",
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      model,
      prompt: prompt.slice(0, 512),
      byteSize: String(imageBytes.byteLength),
      generatedAt: new Date().toISOString(),
    },
  });

  const imageUrl = `https://voltrix.stream/api/hf-videos/${targetFile}`;
  const relativeUrl = `/api/hf-videos/${targetFile}`;

  return {
    ok: true,
    imageUrl,
    relativeUrl,
    filename: targetFile,
    r2Key,
    model,
    prompt: prompt.trim(),
    byteSize: imageBytes.byteLength,
    contentType: "image/png",
    markdownEmbed: `![${prompt.replace(/[[\]]/g, "")}](${imageUrl})`,
    htmlEmbed: `<img src="${imageUrl}" alt="${prompt.replace(/"/g, "&quot;")}" loading="lazy" />`,
  };
}
