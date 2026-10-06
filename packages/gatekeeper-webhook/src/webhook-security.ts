/**
 * Security utilities for the Webhook Gatekeeper:
 * - Constant-time signature & token verification
 * - HMAC-SHA256 signature calculation & validation
 * - Replay attack prevention (timestamp drift verification)
 * - Sliding-window rate limiter per webhook / client IP
 * - Payload size and content-type parsing
 */

export function generateSecureToken(byteLength = 24): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.byteLength !== bufB.byteLength) return false;
  if (typeof crypto !== "undefined" && "subtle" in crypto && typeof (crypto.subtle as { timingSafeEqual?: unknown }).timingSafeEqual === "function") {
    return (crypto.subtle as { timingSafeEqual: (a: ArrayBufferView, b: ArrayBufferView) => boolean }).timingSafeEqual(bufA, bufB);
  }
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
}

export const createHmacSha256 = computeHmacSha256;

export async function computeHmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyHmacSha256(secret: string, message: string, signatureHeader: string): Promise<boolean> {
  let cleanSig = signatureHeader.trim();
  if (cleanSig.startsWith("sha256=")) {
    cleanSig = cleanSig.slice(7).trim();
  }
  const computed = await computeHmacSha256(secret, message);
  return constantTimeEqual(computed.toLowerCase(), cleanSig.toLowerCase());
}

/**
 * Validates whether a timestamp is within the acceptable drift window (default 5 minutes).
 * Protects against replay attacks.
 */
export function isReplayAttack(timestampHeader: string | null | undefined, toleranceSeconds = 300): boolean {
  if (!timestampHeader) return false;
  let parsedMs: number;
  if (/^\d+$/.test(timestampHeader.trim())) {
    const val = parseInt(timestampHeader.trim(), 10);
    // Handle both second and millisecond timestamps
    parsedMs = val < 100_000_000_000 ? val * 1000 : val;
  } else {
    parsedMs = Date.parse(timestampHeader.trim());
  }

  if (isNaN(parsedMs)) return true; // Malformed timestamp is rejected
  const driftSec = Math.abs(Date.now() - parsedMs) / 1000;
  return driftSec > toleranceSeconds;
}

/**
 * Sliding-window rate limiter per key (e.g. webhookId:ip).
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly windowMs: number;

  constructor(windowMs = 60_000) {
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed. Returns true if within limits, false if rate limited.
   */
  allow(key: string, maxHits: number): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let timestamps = this.hits.get(key);
    if (!timestamps) {
      timestamps = [now];
      this.hits.set(key, timestamps);
      return true;
    }

    // Filter out hits older than window
    timestamps = timestamps.filter((t) => t > cutoff);

    if (timestamps.length >= maxHits) {
      this.hits.set(key, timestamps);
      return false;
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);

    // Periodically clean up stale map keys
    if (this.hits.size > 2000) {
      this.cleanup(cutoff);
    }

    return true;
  }

  private cleanup(cutoff: number): void {
    for (const [key, list] of this.hits.entries()) {
      const active = list.filter((t) => t > cutoff);
      if (active.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, active);
      }
    }
  }
}

export class PayloadTooLargeError extends Error {
  constructor(message = "Payload Too Large") {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

/**
 * Safely read and parse the webhook request body up to maxBytes.
 */
export async function parseWebhookPayload(
  req: Request,
  maxBytes: number,
): Promise<{ body: unknown; rawBody: string }> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    throw new PayloadTooLargeError(`Payload exceeds limit of ${maxBytes} bytes`);
  }

  const arrayBuffer = await req.arrayBuffer();
  if (arrayBuffer.byteLength > maxBytes) {
    throw new PayloadTooLargeError(`Payload exceeds limit of ${maxBytes} bytes`);
  }

  const rawBody = new TextDecoder("utf-8").decode(arrayBuffer);
  const contentType = (req.headers.get("content-type") || "").toLowerCase().split(";")[0].trim();

  let body: unknown = null;
  if (contentType === "application/json" && rawBody.trim()) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      // Malformed JSON falls back to null, keeping rawBody
      body = null;
    }
  } else if (contentType === "application/x-www-form-urlencoded" && rawBody.trim()) {
    try {
      const params = new URLSearchParams(rawBody);
      const obj: Record<string, string> = {};
      params.forEach((v, k) => {
        obj[k] = v;
      });
      body = obj;
    } catch {
      body = null;
    }
  }

  return { body, rawBody };
}
