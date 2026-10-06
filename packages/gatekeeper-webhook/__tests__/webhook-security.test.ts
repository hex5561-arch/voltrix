import { describe, expect, it } from "vitest";
import {
  constantTimeEqual,
  createHmacSha256,
  isReplayAttack,
  parseWebhookPayload,
  PayloadTooLargeError,
  SlidingWindowRateLimiter,
  verifyHmacSha256,
} from "../src/webhook-security.js";

describe("Webhook Security Suite", () => {
  it("verifies constantTimeEqual correctly", () => {
    expect(constantTimeEqual("secret-token-123", "secret-token-123")).toBe(true);
    expect(constantTimeEqual("secret-token-123", "secret-token-456")).toBe(false);
    expect(constantTimeEqual("short", "longer-string")).toBe(false);
  });

  it("generates and verifies HMAC-SHA256 signatures", async () => {
    const secret = "test-secret-key-32-bytes-long-123";
    const payload = JSON.stringify({ event: "order.created", amount: 100 });

    const signature = await createHmacSha256(secret, payload);
    expect(signature).toHaveLength(64);

    // Valid signature with sha256= prefix
    expect(await verifyHmacSha256(secret, payload, `sha256=${signature}`)).toBe(true);
    // Valid signature bare hex
    expect(await verifyHmacSha256(secret, payload, signature)).toBe(true);
    // Invalid signature
    expect(await verifyHmacSha256(secret, payload, "sha256=badbadbadbad")).toBe(false);
    // Tampered payload
    expect(await verifyHmacSha256(secret, payload + " ", `sha256=${signature}`)).toBe(false);
  });

  it("prevents replay attacks via timestamp verification", () => {
    const now = Math.floor(Date.now() / 1000);
    // Current timestamp is valid
    expect(isReplayAttack(String(now), 300)).toBe(false);

    // 2 minutes ago is valid (within 300s)
    expect(isReplayAttack(String(now - 120), 300)).toBe(false);

    // 10 minutes ago is an expired replay
    expect(isReplayAttack(String(now - 600), 300)).toBe(true);

    // Future timestamp beyond drift allowance
    expect(isReplayAttack(String(now + 600), 300)).toBe(true);

    // Malformed timestamp is rejected
    expect(isReplayAttack("not-a-number", 300)).toBe(true);
  });

  it("enforces sliding window rate limits", () => {
    const limiter = new SlidingWindowRateLimiter(60_000);
    const key = "test-client-ip";
    const limit = 5;

    for (let i = 0; i < limit; i++) {
      expect(limiter.allow(key, limit)).toBe(true);
    }

    // Exceeding limit should be rejected
    expect(limiter.allow(key, limit)).toBe(false);
    expect(limiter.allow(key, limit)).toBe(false);

    // Different key should still be allowed
    expect(limiter.allow("different-ip", limit)).toBe(true);
  });

  it("enforces max payload bytes protection", async () => {
    const smallPayload = JSON.stringify({ message: "hello" });
    const reqSmall = new Request("https://example.com/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: smallPayload,
    });

    const parsed = await parseWebhookPayload(reqSmall, 1024);
    expect(parsed.rawBody).toBe(smallPayload);
    expect(parsed.body).toEqual({ message: "hello" });

    // Payload exceeding limit should throw PayloadTooLargeError
    const largePayload = "x".repeat(2048);
    const reqLarge = new Request("https://example.com/webhook", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: largePayload,
    });

    await expect(parseWebhookPayload(reqLarge, 1024)).rejects.toThrow(PayloadTooLargeError);
  });
});
