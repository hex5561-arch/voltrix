import { DurableObject } from "cloudflare:workers";
import type { HookInitiator } from "@gadgets/workshop-shared/gatekeeper";
import type { StoredWebhook, WebhookHookTarget, WebhookInitiator } from "./webhook-types.js";
import type { WebhookEvent, WebhookResponse } from "./types.js";
import {
  constantTimeEqual,
  isReplayAttack,
  parseWebhookPayload,
  PayloadTooLargeError,
  SlidingWindowRateLimiter,
  verifyHmacSha256,
} from "./webhook-security.js";

const rateLimiter = new SlidingWindowRateLimiter(60_000);

export class WebhookDriver extends DurableObject {
  private readonly webhooks = new Map<string, StoredWebhook>();
  private readonly slugIndex = new Map<string, string>(); // slug -> id
  private readonly initiators = new Map<string, WebhookInitiator>();
  private globalEnabled = true;

  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      await this.initStorage();
    });
  }

  private async initStorage(): Promise<void> {
    const enabled = await this.ctx.storage.get<boolean>("meta:globalEnabled");
    if (enabled !== undefined) {
      this.globalEnabled = enabled;
    }

    const records = await this.ctx.storage.list<StoredWebhook>({ prefix: "wh:" });
    for (const [key, value] of records.entries()) {
      const id = key.slice(3);
      this.webhooks.set(id, value);
      this.slugIndex.set(value.slug, id);
    }
    const caps = await this.ctx.storage.list<WebhookInitiator>({ prefix: "cap:" });
    for (const [key, value] of caps.entries()) {
      const id = key.slice(4);
      this.initiators.set(id, value);
    }
  }

  async setGlobalEnabled(enabled: boolean): Promise<void> {
    this.globalEnabled = enabled;
    await this.ctx.storage.put("meta:globalEnabled", enabled);
  }

  async isGlobalEnabled(): Promise<boolean> {
    return this.globalEnabled;
  }

  async registerWebhook(webhook: StoredWebhook, initiator: WebhookInitiator): Promise<void> {
    this.webhooks.set(webhook.id, webhook);
    this.slugIndex.set(webhook.slug, webhook.id);
    this.initiators.set(webhook.id, initiator);

    await this.ctx.storage.put(`wh:${webhook.id}`, webhook);
    await this.ctx.storage.put(`cap:${webhook.id}`, initiator);
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    const existing = this.webhooks.get(webhookId);
    if (existing) {
      this.slugIndex.delete(existing.slug);
    }
    this.webhooks.delete(webhookId);
    this.initiators.delete(webhookId);

    await this.ctx.storage.delete(`wh:${webhookId}`);
    await this.ctx.storage.delete(`cap:${webhookId}`);
  }

  async revokeAccount(accountId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const [id, wh] of this.webhooks.entries()) {
      if (wh.accountId === accountId) {
        toDelete.push(id);
      }
    }
    for (const id of toDelete) {
      await this.unregisterWebhook(id);
    }
  }

  async listWebhooks(workspaceId?: string): Promise<StoredWebhook[]> {
    const all = [...this.webhooks.values()];
    if (workspaceId) {
      return all.filter((w) => w.workspaceId === workspaceId);
    }
    return all;
  }

  async getWebhook(idOrSlug: string): Promise<StoredWebhook | null> {
    const byId = this.webhooks.get(idOrSlug);
    if (byId) return byId;
    const mappedId = this.slugIndex.get(idOrSlug);
    if (mappedId) return this.webhooks.get(mappedId) ?? null;
    return null;
  }

  /**
   * Primary HTTP handler for incoming webhook calls.
   * Path: /gatekeeper/webhook/:slugOrId or /:slugOrId
   */
  async fetch(req: Request): Promise<Response> {
    // 0. Hard master kill switch
    if (!this.globalEnabled) {
      return new Response(
        JSON.stringify({
          error: "Webhook gateway is currently paused / disabled by administrator.",
          code: "GATEKEEPER_WEBHOOK_DISABLED",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);

    // Remove "gatekeeper" and "webhook" prefixes if present
    let targetSlugOrId = "";
    if (parts[0] === "gatekeeper" && parts[1] === "webhook") {
      targetSlugOrId = parts.slice(2).join("/");
    } else if (parts[0] === "webhook") {
      targetSlugOrId = parts.slice(1).join("/");
    } else {
      targetSlugOrId = parts.join("/");
    }

    // Health/status check route for admin or monitoring
    if (targetSlugOrId === "_health" || targetSlugOrId === "health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          enabled: this.globalEnabled,
          activeWebhooks: this.webhooks.size,
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!targetSlugOrId) {
      return new Response(JSON.stringify({ error: "Missing webhook identifier" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const webhook = await this.getWebhook(targetSlugOrId);
    if (!webhook) {
      return new Response(JSON.stringify({ error: "Webhook not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!webhook.enabled) {
      return new Response(JSON.stringify({ error: "Webhook is currently disabled" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. HTTP Method validation
    if (!webhook.methods.includes(req.method.toUpperCase())) {
      return new Response(JSON.stringify({ error: `Method ${req.method} not allowed` }), {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: webhook.methods.join(", ") },
      });
    }

    // 2. Rate limiting (per webhook + IP)
    const clientIp = req.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitKey = `${webhook.id}:${clientIp}`;
    if (!rateLimiter.allow(rateLimitKey, webhook.rateLimitPerMinute)) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please retry later.",
          limitPerMinute: webhook.rateLimitPerMinute,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }

    // 3. Payload size and parsing
    let parsed: { body: unknown; rawBody: string };
    try {
      parsed = await parseWebhookPayload(req, webhook.maxPayloadBytes);
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 413,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to read request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Replay attack check
    const timestampHeader = req.headers.get("x-webhook-timestamp") || req.headers.get("x-timestamp");
    if (timestampHeader && isReplayAttack(timestampHeader)) {
      return new Response(
        JSON.stringify({ error: "Webhook timestamp expired (replay attack prevented)" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5. Secret & HMAC signature validation
    if (webhook.secret) {
      let authorized = false;

      // Check HMAC signature: X-Webhook-Signature: sha256=<hex>
      const signatureHeader =
        req.headers.get("x-webhook-signature") ||
        req.headers.get("x-hub-signature-256") ||
        req.headers.get("x-signature");

      if (signatureHeader) {
        // If timestamp was included, check both signed formats
        const signedPayload = timestampHeader ? `${timestampHeader}.${parsed.rawBody}` : parsed.rawBody;
        authorized =
          (await verifyHmacSha256(webhook.secret, signedPayload, signatureHeader)) ||
          (await verifyHmacSha256(webhook.secret, parsed.rawBody, signatureHeader));
      } else if (!webhook.requireSignature) {
        // Header secret or Bearer token
        const headerSecret = req.headers.get("x-webhook-secret") || req.headers.get("x-api-key");
        const authHeader = req.headers.get("authorization");
        let bearerToken = "";
        if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
          bearerToken = authHeader.slice(7).trim();
        }
        const querySecret = url.searchParams.get("secret");

        if (headerSecret && constantTimeEqual(headerSecret, webhook.secret)) {
          authorized = true;
        } else if (bearerToken && constantTimeEqual(bearerToken, webhook.secret)) {
          authorized = true;
        } else if (querySecret && constantTimeEqual(querySecret, webhook.secret)) {
          authorized = true;
        }
      }

      if (!authorized) {
        return new Response(
          JSON.stringify({ error: "Invalid webhook secret or signature" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // 6. Deliver event into gadget via HookInitiator
    const initiator = this.initiators.get(webhook.id);
    if (!initiator) {
      return new Response(JSON.stringify({ error: "Webhook listener is not currently connected" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const eventId = crypto.randomUUID();
    const event: WebhookEvent = {
      id: eventId,
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      query: Object.fromEntries(url.searchParams.entries()),
      body: parsed.body,
      rawBody: parsed.rawBody,
      timestamp: new Date().toISOString(),
    };

    try {
      // @ts-expect-error Worker RPC promises are disposable
      using hookCall = initiator.startHook();
      const hookSession = await hookCall;

      try {
        await hookSession.approvalQueue.authorizeObservation({
          title: `Webhook received: ${webhook.title || webhook.slug}`,
          description: `Received ${req.method} webhook to /gatekeeper/webhook/${webhook.slug} (ID: ${eventId})`,
        });
      } catch {
        // Non-fatal if observation recording fails
      }

      const customResponse = await hookSession.callback.onWebhook(event);

      if (customResponse && typeof customResponse === "object") {
        const status = customResponse.status ?? 200;
        const resHeaders = new Headers(customResponse.headers || {});
        if (!resHeaders.has("Content-Type")) {
          resHeaders.set("Content-Type", "application/json");
        }
        const resBody =
          typeof customResponse.body === "string"
            ? customResponse.body
            : JSON.stringify(customResponse.body ?? { ok: true, id: eventId });
        return new Response(resBody, { status, headers: resHeaders });
      }

      return new Response(
        JSON.stringify({
          ok: true,
          id: eventId,
          timestamp: event.timestamp,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (deliveryError) {
      console.error(`Failed to deliver webhook ${webhook.id}:`, deliveryError);
      return new Response(
        JSON.stringify({
          error: "Webhook event delivery failed",
          id: eventId,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }
}
