import type { RpcStub, RpcTarget } from "cloudflare:workers";

export interface WebhookSession {
  /**
   * Register a persistent inbound webhook listener.
   * Creates an HTTPS endpoint that forwards received HTTP events directly into the callback.
   */
  onWebhook(options: WebhookOptions, callback: RpcStub<WebhookHook>): Promise<WebhookRegistration>;

  /**
   * List all active webhooks for this workspace.
   */
  listWebhooks(): Promise<WebhookSummary[]>;

  /**
   * Unregister / delete a webhook.
   */
  removeWebhook(webhookId: string): Promise<void>;
}

export interface WebhookOptions {
  /**
   * Optional custom URL slug (e.g. "payment-hook" -> https://voltrix.stream/gatekeeper/webhook/payment-hook).
   * If omitted, a random high-entropy slug is generated.
   */
  slug?: string;

  /**
   * Human-readable label for this webhook (e.g. "Stripe payment confirmation").
   */
  title?: string;

  /**
   * Detailed description of what triggers this webhook.
   */
  description?: string;

  /**
   * Optional secret key for authentication. If omitted, a high-entropy secret is automatically generated.
   */
  secret?: string;

  /**
   * Whether to strictly require HMAC-SHA256 signature verification (X-Webhook-Signature).
   * Default: false (allows Bearer token, X-Webhook-Secret header, or query secret).
   */
  requireSignature?: boolean;

  /**
   * Allowed HTTP methods for this webhook. Default: ["POST"].
   */
  methods?: string[];

  /**
   * Maximum allowed payload size in bytes. Default: 65536 (64 KB). Max: 1048576 (1 MB).
   */
  maxPayloadBytes?: number;

  /**
   * Maximum allowed requests per minute. Default: 60. Max: 300.
   */
  rateLimitPerMinute?: number;
}

export interface WebhookHook extends RpcTarget {
  /**
   * Called when an inbound webhook event is received and validated.
   */
  onWebhook(event: WebhookEvent): Promise<WebhookResponse | void>;
}

export interface WebhookEvent {
  /** Unique delivery event ID */
  id: string;
  /** Full request URL */
  url: string;
  /** HTTP method (POST, PUT, GET, etc.) */
  method: string;
  /** Request headers (lowercased keys) */
  headers: Record<string, string>;
  /** Query string parameters */
  query: Record<string, string>;
  /** Parsed JSON body (if Content-Type is application/json) or parsed form object, otherwise null */
  body: unknown;
  /** Raw text body of the request */
  rawBody: string;
  /** ISO timestamp when the event was received */
  timestamp: string;
}

export interface WebhookResponse {
  /** HTTP response status code to return to the webhook sender (default: 200) */
  status?: number;
  /** Custom response headers */
  headers?: Record<string, string>;
  /** Response body to return to the sender (JSON object or string) */
  body?: unknown;
}

export interface WebhookRegistration {
  /** Unique webhook ID */
  id: string;
  /** URL slug */
  slug: string;
  /** Full publicly-callable HTTPS webhook URL */
  webhookUrl: string;
  /** Secret key required for authentication */
  secret: string;
}

export interface WebhookSummary {
  id: string;
  slug: string;
  webhookUrl: string;
  title: string;
  description: string;
  methods: string[];
  maxPayloadBytes: number;
  rateLimitPerMinute: number;
  requireSignature: boolean;
  createdAt: string;
}
