import {
  DurableObject,
  RpcStub as NativeRpcStub,
  RpcTarget,
  WorkerEntrypoint,
} from "cloudflare:workers";
import { skipRpcValidation, validateRpc } from "capnweb-validate";
import type {
  AccountDescription,
  ActionKind,
  AgentCatalog,
  ApprovalQueue,
  Gatekeeper,
  GatekeeperConnectCallback,
  GatekeeperConnectOptions,
  GatekeeperUser,
  GatekeeperUserVerifier,
  HookController,
  HookInitiator,
  HookTargetMetadata,
  ObservationAuthorizer,
  ResourceConfiguratorFrame,
  ResourceDescription,
  SupportedResource,
  VendorDescription,
} from "@gadgets/workshop-shared/gatekeeper";
import type {
  WebhookEvent,
  WebhookHook,
  WebhookOptions,
  WebhookRegistration,
  WebhookResponse,
  WebhookSession,
  WebhookSummary,
} from "./types.js";
import type {
  StoredWebhook,
  WebhookHookTarget,
  WebhookInitiator,
} from "./webhook-types.js";
import { WebhookDriver } from "./webhook-driver.js";
import TYPES_CODE from "./types.txt";

const WEBHOOK_ICON = {
  url:
    "data:image/svg+xml," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' fill='currentColor'>" +
        "<path d='M216 152a40 40 0 0 0-38.64 29.83l-45.74-22.87a40 40 0 0 0 0-61.92l45.74-22.87A40 40 0 1 0 168 48a39.81 39.81 0 0 0 1.64 11.23l-45.74 22.87a40 40 0 1 0 0 89.8l45.74 22.87A39.81 39.81 0 0 0 168 208a40 40 0 1 0 48-56Z'/>" +
        "</svg>",
    ),
};

export type WebhookControllerProps = {
  accountId: string;
  workspaceId: string;
  webhookId: string;
  webhook: StoredWebhook;
};

type ControllerFactory = (
  props: WebhookControllerProps,
) => Fetcher<HookController<WebhookHookTarget>>;

function normalizeSlug(slug: string): string {
  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!normalized) {
    throw new Error("Invalid webhook slug: slug must contain alphanumeric characters.");
  }
  return normalized;
}

function generateSecureSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type WebhookSessionDependencies = {
  accountId: string;
  workspaceId: string;
  approvalQueue: NativeRpcStub<ApprovalQueue>;
  controllerFactory: ControllerFactory;
  driver: DurableObjectStub<WebhookDriver>;
  baseUrl?: string;
};

@validateRpc()
export class WebhookSessionImpl extends RpcTarget implements WebhookSession {
  readonly #accountId: string;
  readonly #workspaceId: string;
  readonly #approvalQueue: NativeRpcStub<ApprovalQueue>;
  readonly #controllerFactory: ControllerFactory;
  readonly #driver: DurableObjectStub<WebhookDriver>;
  readonly #baseUrl: string;

  constructor(dependencies: WebhookSessionDependencies) {
    super();
    this.#accountId = dependencies.accountId;
    this.#workspaceId = dependencies.workspaceId;
    this.#approvalQueue = dependencies.approvalQueue;
    this.#controllerFactory = dependencies.controllerFactory;
    this.#driver = dependencies.driver;
    this.#baseUrl = dependencies.baseUrl ?? "https://voltrix.stream";
  }

  async onWebhook(
    options: WebhookOptions,
    callback: NativeRpcStub<WebhookHookTarget>,
  ): Promise<WebhookRegistration> {
    const id = "wh_" + crypto.randomUUID().replaceAll("-", "");
    const slug = options.slug ? normalizeSlug(options.slug) : id;

    // Check slug collision
    const existing = await this.#driver.getWebhook(slug);
    if (existing && existing.id !== id) {
      throw new Error(`Webhook slug "${slug}" is already in use by another webhook.`);
    }

    const secret = options.secret?.trim() || generateSecureSecret();
    const maxPayloadBytes = Math.min(
      Math.max(options.maxPayloadBytes ?? 65536, 1024),
      1048576, // 1 MB upper cap for safety
    );
    const rateLimitPerMinute = Math.min(
      Math.max(options.rateLimitPerMinute ?? 60, 5),
      300, // 300 req/min upper cap
    );
    const methods =
      options.methods && options.methods.length > 0
        ? options.methods.map((m) => m.toUpperCase())
        : ["POST"];

    const stored: StoredWebhook = {
      version: 1,
      id,
      slug,
      accountId: this.#accountId,
      workspaceId: this.#workspaceId,
      title: options.title || slug,
      description: options.description || "",
      secret,
      methods,
      maxPayloadBytes,
      rateLimitPerMinute,
      requireSignature: options.requireSignature ?? false,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const controller = this.#controllerFactory({
      accountId: this.#accountId,
      workspaceId: this.#workspaceId,
      webhookId: id,
      webhook: stored,
    });

    await this.#approvalQueue.bindHook(callback, controller);

    const base = this.#baseUrl.replace(/\/$/, "");
    const webhookUrl = `${base}/gatekeeper/webhook/${slug}`;

    return {
      id,
      slug,
      webhookUrl,
      secret,
    };
  }

  async listWebhooks(): Promise<WebhookSummary[]> {
    const list = await this.#driver.listWebhooks(this.#workspaceId);
    const base = this.#baseUrl.replace(/\/$/, "");
    return list.map((w) => ({
      id: w.id,
      slug: w.slug,
      webhookUrl: `${base}/gatekeeper/webhook/${w.slug}`,
      title: w.title,
      description: w.description,
      methods: w.methods,
      maxPayloadBytes: w.maxPayloadBytes,
      rateLimitPerMinute: w.rateLimitPerMinute,
      requireSignature: w.requireSignature,
      createdAt: w.createdAt,
    }));
  }

  async removeWebhook(webhookId: string): Promise<void> {
    const webhook = await this.#driver.getWebhook(webhookId);
    if (webhook && webhook.workspaceId === this.#workspaceId) {
      await this.#driver.unregisterWebhook(webhookId);
    }
  }
}

@validateRpc()
export class WebhookHookController
  extends WorkerEntrypoint<Cloudflare.Env, WebhookControllerProps>
  implements HookController<WebhookHookTarget>
{
  async enable(initiator: WebhookInitiator, target: HookTargetMetadata): Promise<void> {
    const webhookWithGadget: StoredWebhook = {
      ...this.ctx.props.webhook,
      gadgetId: target.gadgetId,
    };
    await this.#driver().registerWebhook(webhookWithGadget, initiator);
  }

  async disable(): Promise<void> {
    await this.#driver().unregisterWebhook(this.ctx.props.webhookId);
  }

  #driver(): DurableObjectStub<WebhookDriver> {
    return this.ctx.exports.WebhookDriver.getByName("global");
  }
}

@validateRpc()
export class WebhookGatekeeper
  extends DurableObject<Cloudflare.Env, { accountId: string }>
  implements Gatekeeper<WebhookSession>
{
  async describe(): Promise<ResourceDescription> {
    return {
      url: "webhook://gateway",
      title: "Inbound Webhooks",
      snippet: "Receive inbound HTTP webhooks with rate limiting and signature verification.",
      suggestedBindingName: "WEBHOOK",
      tsType: "WebhookSession",
      hookTsType: "WebhookHook",
    };
  }

  async getTypeScriptTypes(): Promise<string> {
    return TYPES_CODE;
  }

  async getAutoApprovableActions(): Promise<ActionKind[]> {
    return [];
  }

  async startSession(approvalQueue: NativeRpcStub<ApprovalQueue>): Promise<WebhookSession> {
    const workspaceId = this.ctx.id.toString();
    if (!workspaceId || workspaceId === this.ctx.props.accountId) {
      throw new Error("Invalid inherited webhook workspace scope.");
    }
    const baseUrl = (this.env as Record<string, unknown>).PUBLIC_BASE_URL as string | undefined;

    return new WebhookSessionImpl({
      accountId: this.ctx.props.accountId,
      workspaceId,
      approvalQueue: approvalQueue.dup(),
      controllerFactory: (props) => this.ctx.exports.WebhookHookController({ props }),
      driver: this.ctx.exports.WebhookDriver.getByName("global"),
      baseUrl: baseUrl || "https://voltrix.stream",
    });
  }

  async getAgentCatalog(
    _authorizer: NativeRpcStub<ObservationAuthorizer>,
  ): Promise<AgentCatalog | null> {
    return null;
  }

  async addObserver(_id: string, _user: Fetcher<GatekeeperUserVerifier>): Promise<void> {}

  async removeObserver(_id: string): Promise<void> {}

  applyAction(_action: number): Promise<void> {
    throw new Error("Webhooks gatekeeper is reactive and implements no manual actions.");
  }

  rejectAction(_action: number): Promise<void> {
    throw new Error("Webhooks gatekeeper is reactive and implements no manual actions.");
  }

  revertAction(
    _action: number,
  ): Promise<void | { message?: string; canRetry?: boolean; restart?: boolean }> {
    throw new Error("Webhooks gatekeeper is reactive and implements no manual actions.");
  }
}

@validateRpc()
export class WebhookVerifier
  extends WorkerEntrypoint<Cloudflare.Env>
  implements GatekeeperUserVerifier
{
  verify(): void {}
}

type WebhookAccountProps = { accountId: string };

@validateRpc()
export class WebhookAccount
  extends WorkerEntrypoint<Cloudflare.Env, WebhookAccountProps>
  implements GatekeeperUser
{
  async describe(): Promise<AccountDescription> {
    return {
      displayName: "Inbound Webhooks",
      avatar: WEBHOOK_ICON,
      singleton: { tsType: "WebhookSession" },
      providesUi: { title: "Webhooks", icon: WEBHOOK_ICON },
    };
  }

  async getSingletonGatekeeperClass(): Promise<DurableObjectClass<Gatekeeper<WebhookSession>>> {
    return this.ctx.exports.WebhookGatekeeper({ props: this.ctx.props });
  }

  async getSupportedResources(): Promise<SupportedResource[]> {
    return [];
  }

  getGatekeeperClassFor(_url: string): never {
    throw new Error("Inbound Webhooks has no URL-addressed resources.");
  }

  startResourceConfigurator(_resourceUrlPattern: string): Promise<ResourceConfiguratorFrame> {
    throw new Error("Inbound Webhooks has no URL-addressed resources.");
  }

  async ensureResources(_resourceUrlPatterns: string[]): Promise<{ url?: string }> {
    return {};
  }

  async revoke(): Promise<void> {
    await this.#driver().revokeAccount(this.ctx.props.accountId);
  }

  reconnect(): Promise<{ url: string }> {
    throw new Error("Inbound Webhooks has no interactive connect flow.");
  }

  async getAuthenticatedEmail(): Promise<string | null> {
    return null;
  }

  @skipRpcValidation()
  async getVerifier(): Promise<Fetcher<GatekeeperUserVerifier>> {
    return this.ctx.exports.WebhookVerifier({});
  }

  #driver(): DurableObjectStub<WebhookDriver> {
    return this.ctx.exports.WebhookDriver.getByName("global");
  }
}

@validateRpc()
export class GatekeeperVendor extends WorkerEntrypoint<Cloudflare.Env> {
  async describe(): Promise<VendorDescription> {
    return {
      displayName: "Inbound Webhooks",
      url: "https://voltrix.stream",
      logo: WEBHOOK_ICON,
      tagline: "Receive inbound HTTP webhooks",
      description: "Secure, rate-limited inbound HTTP webhook gateway for external systems.",
      autoProvisionsAccount: true,
      providesAuth: false,
    };
  }

  @skipRpcValidation()
  async createAccount(): Promise<Fetcher<GatekeeperUser>> {
    return this.ctx.exports.WebhookAccount({
      props: { accountId: crypto.randomUUID() },
    }) as unknown as Fetcher<GatekeeperUser>;
  }

  connectAccount(
    _callback: Fetcher<GatekeeperConnectCallback>,
    _options?: GatekeeperConnectOptions,
  ): Promise<{ url: string }> {
    throw new Error("Inbound Webhooks is auto-provisioned and has no connect flow.");
  }

  async getSupportedResources(_options?: { userId?: string }): Promise<SupportedResource[]> {
    return [];
  }

  async getTypeScriptTypes(): Promise<string> {
    return TYPES_CODE;
  }

  /**
   * Dispatches incoming HTTP webhook requests directly to the WebhookDriver DO.
   */
  async fetch(req: Request): Promise<Response> {
    const driver = this.ctx.exports.WebhookDriver.getByName("global");
    return driver.fetch(req);
  }
}
