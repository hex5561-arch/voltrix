import type { RpcTarget } from "cloudflare:workers";
import type { HookInitiator } from "@gadgets/workshop-shared/gatekeeper";
import type { WebhookHook } from "./types.js";

export type WebhookHookTarget = RpcTarget & WebhookHook;
export type WebhookInitiator = Fetcher<HookInitiator<WebhookHookTarget>>;

export type StoredWebhook = {
  version: 1;
  id: string;
  slug: string;
  accountId: string;
  workspaceId: string;
  title: string;
  description: string;
  secret: string;
  methods: string[];
  maxPayloadBytes: number;
  rateLimitPerMinute: number;
  requireSignature: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  gadgetId?: number;
};
