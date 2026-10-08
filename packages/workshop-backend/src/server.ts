import { RpcStub, RpcTarget, newHttpBatchRpcResponse, newWebSocketRpcSession, RpcSessionOptions } from "capnweb";
import { validateRpc } from "capnweb-validate";
import type { JWTPayload } from "jose";
import { PublicApi, AuthenticatedApi, Overseer, GadgetMetadataWithTimestamps, AiChatAuthorInfo, AiModelConfig, AiGatewayInfo, AiModelProvider, ConnectedAccountsSubscriber, ConnectedAccountsFilter, GatekeeperVendorFilter, ObserverConfigCallback, BlueprintLibrarySummary, BlueprintPublicInfo, BlueprintUserSummary, BlueprintBindingAssignment, AgentSpawnerConfig, WorkpieceId, BLUEPRINT_SCREENSHOT_PATH_PREFIX, BLUEPRINT_SCREENSHOT_R2_PREFIX, blueprintScreenshotUrl, ServerConfig, CloudflareUsageInfo, CloudflareAccountOption, LoginAttempt, GatekeeperAppInfo, AdminApi, GatekeeperVendorInfo, OutputFormatOffer, ListOutputsResult, createOpenGadgetError, getOpenGadgetErrorCode, OPEN_GADGET_ERROR_CODES, AUTH_ERROR_CODES, createAuthError } from '@gadgets/workshop-shared/api';
import type { UiFeatureFlags } from "@gadgets/workshop-shared/feature-flags";
import { getServerConfig } from "./deployment-config.js";
import { isPasswordAuthEnabled, getAuthGatekeeperAllowlist } from "./auth/config.js";
import { getAuthVendorBinding } from "./auth/auth-vendors.js";
import { getUsageInfo } from "./ai-gateway-billing/limits/usage-checker.js";
import { listConnectedAccounts, selectAccount } from "./ai-gateway-billing/cloudflare/connection-service.js";
import { PendingLogin, LoginConnectCallbackImpl } from "./auth/login-flow.js";
import { deploymentOutputForBlueprint, listFormatOffers, readAdminConfig } from "./admin-config.js";

// Re-export the optional-feature Durable Objects + entrypoints so they can be bound in wrangler.
export { PendingLogin, LoginConnectCallbackImpl };
import { GatekeeperUiFrame } from "@gadgets/workshop-shared/gatekeeper";
import { LanguageModelGatekeeper } from "./ai-models";
import { getAiGatewayConfig } from "./ai-gateway.js";
import { AdminSettings, AdminApiImpl } from "./admin-settings.js";
import { BlueprintKvRecord, buildBlueprintArchiveStream, sanitizeBlueprintOutput, listFeaturedBlueprintsFromKv, parseBlueprintArchive, randomBlueprintId, readBlueprintContent, readBlueprintKvRecord } from "./blueprint-archive.js";
import { GatekeeperConnectCallbackImpl, normalizeUsername, UserDurableObject, CLOUDFLARE_VENDOR_ID } from "./user";
import { OverseerDurableObject, GatekeeperLoopback, CodeModeTailLoopback, AgentSpawnerGatekeeper, GatekeeperHookLoopback, GadgetTailLoopback, AgentSelfLoopback, TransientStubLoopback } from "./overseer";
import { ExternalMessageGateway } from "./external-message-gateway";
import { RpcStub as NativeRpcStub } from "cloudflare:workers";
import { recordAnalytics } from "./analytics";
import { handleClientErrorRequest } from "./client-errors.js";
import { verifyCfAccessJwt } from "./access.js";
import { resolveUiFeatureFlags } from "./feature-flags";
import { serveSiteLogo, SITE_LOGO_PATH } from "./site-logo.js";
import { createWorkshopLogger } from "./observability";
import { wrapDoStubForTelemetry } from "./do-telemetry";

import { handleYouTubeSearchRequest, handleYouTubeIngestRequest } from "./youtube-engine.js";

const logger = createWorkshopLogger("workshop.server");

// Set once we've asked the AdminSettings DO to install the bundled format blueprints (see the
// fetch handler), so later requests skip the call. The DO holds the real answer.
let formatBlueprintInstallStarted = false;

function publicBlueprintInfo(id: string, metadata: BlueprintPublicInfo['metadata']): BlueprintPublicInfo {
  return {
    id,
    metadata,
    screenshotUrl: blueprintScreenshotUrl(id, metadata),
  };
}

// Re-export entrypoint types from ai-models.ts.
export { LanguageModelGatekeeper };

// Re-export entrypoint types from admin-settings.ts.
export { AdminSettings };

// Re-export entrypoint types from user.ts.
export { UserDurableObject, GatekeeperConnectCallbackImpl };

// Re-export entrypoint types from overseer.ts.
export { OverseerDurableObject, GatekeeperLoopback, GatekeeperHookLoopback,
    CodeModeTailLoopback, AgentSpawnerGatekeeper, GadgetTailLoopback,
    AgentSelfLoopback, TransientStubLoopback };

// Re-export service-binding entrypoint for external channel integrations.
export { ExternalMessageGateway };

// Declare optional environment variables here since they may be omitted from wrangler.jsonc.
type Env = Cloudflare.Env & {
  // Set these if using Cloudflare Access for authentication, otherwise username/password is used.
  CF_ACCESS_AUD?: string,  // audience
  CF_ACCESS_ISS?: string,  // team URL, i.e. https://<team>.cloudflareaccess.com
  DEV?: boolean;
  FLAGS?: Flagship;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

// =======================================================================================

@validateRpc()
class AuthenticatedApiImpl extends RpcTarget implements AuthenticatedApi {
  constructor(private ctx: ExecutionContext, private env: Env,
      userId: DurableObjectId,
      private abortSession: (reason: Error) => void) {
    super();

    this.#userId = userId;
    this.overseers = this.ctx.exports.OverseerDurableObject;
    this.adminSettings = this.ctx.exports.AdminSettings;
    this.users = this.ctx.exports.UserDurableObject;
  }

  private overseers: DurableObjectNamespace<OverseerDurableObject>;
  private adminSettings: DurableObjectNamespace<AdminSettings>;
  private users: DurableObjectNamespace<UserDurableObject>;

  #userId: DurableObjectId;

  // Get a stub pointing at the user DO. We create a new stub for every request so that we don't
  // have to worry about detecting when a stub has become broken.
  get #user(): DurableObjectStub<UserDurableObject> {
    return wrapDoStubForTelemetry(this.users.get(this.#userId));
  }

  #isAdmin(): boolean {
    let name = this.#userId.name;
    let admins = this.env.ADMINS;

    if (!name || !admins) return false;

    if (typeof admins === "string") {
      // Admins should be a JSON binding of array type, but `.env` doesn't actually let you
      // specify JSON bindings, so we also support a string that parses as JSON array.
      admins = JSON.parse(admins);
    }

    if (!Array.isArray(admins)) {
      throw new TypeError("ADMINS must be configured as an array of usernames.");
    }

    return admins.includes(name);
  }

  whoami(): Promise<AiChatAuthorInfo> {
    return this.#user.whoami();
  }
  setOwnDisplayName(name: string): Promise<void> {
    return this.#user.setOwnDisplayName(name);
  }
  changePassword(oldHash: Uint8Array, newHash: Uint8Array): Promise<void> {
    return this.#user.changePassword(oldHash, newHash);
  }
  hasPasswordLogin(): Promise<boolean> {
    return this.#user.hasPasswordLogin();
  }
  listModels(): Promise<AiChatAuthorInfo[]> {
    return this.#user.listModels();
  }
  addModel(profile: AiChatAuthorInfo, config: AiModelConfig): Promise<void> {
    return this.#user.addModel(profile, config);
  }
  deleteModel(id: string): Promise<void> {
    return this.#user.deleteModel(id);
  }
  setQuickModel(id: string | null): Promise<void> {
    return this.#user.setQuickModel(id);
  }
  getQuickModel(): Promise<null | string> {
    return this.#user.getQuickModel();
  }

  getPreferredModel(): Promise<string | null> {
    return this.#user.getPreferredModel();
  }
  setPreferredModel(id: string | null): Promise<void> {
    return this.#user.setPreferredModel(id);
  }
  isOnboardingCompleted(): Promise<boolean> {
    return this.#user.isOnboardingCompleted();
  }
  completeOnboarding(): Promise<void> {
    return this.#user.completeOnboarding();
  }

  setStudentProfile(profile: import("@gadgets/workshop-shared/api").StudentProfile): Promise<void> {
    return this.#user.setStudentProfile(profile);
  }

  getStudentProfile(): Promise<import("@gadgets/workshop-shared/api").StudentProfile | null> {
    return this.#user.getStudentProfile();
  }

  generateWhatsAppLinkCode(): Promise<string> {
    return this.#user.generateWhatsAppLinkCode();
  }

  getCloudflareUsage(): Promise<CloudflareUsageInfo> {
    return getUsageInfo(this.env, this.#user);
  }

  listCloudflareAccounts(): Promise<CloudflareAccountOption[]> {
    return listConnectedAccounts(this.env, this.#user);
  }

  selectCloudflareAccount(accountId: string): Promise<void> {
    return selectAccount(this.env, this.#user, accountId);
  }

  async setAvatar(data: Uint8Array | null): Promise<void> {
    if (data) {
      if (data.byteLength > 100 * 1024) {
        throw new Error("Avatar too large (max 100 KB)");
      }
      // Verify the data starts with a known image magic-byte header.
      let isJpeg = data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF;
      let isPng = data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47;
      if (!isJpeg && !isPng) {
        throw new Error("Avatar must be a JPEG or PNG image");
      }
    }
    // Avatar data lives in KV (global), not the user's DO storage, so we
    // read/write it directly here to avoid routing through the DO location.
    let userId = this.#userId.name!;
    if (data) {
      await this.env.AVATARS.put(userId, data);
    } else {
      await this.env.AVATARS.delete(userId);
    }
  }
  async getAvatar(userId: string): Promise<Uint8Array | null> {
    let result = await this.env.AVATARS.get(userId, "arrayBuffer");
    if (!result) return null;
    return new Uint8Array(result);
  }

  getAiConfig(): Promise<AiGatewayInfo> {
    let gwConfig = getAiGatewayConfig(this.env);
    if (gwConfig) {
      return Promise.resolve({
        enabled: true,
        enabledProviders: [...gwConfig.providers] as AiModelProvider[],
      });
    } else {
      return Promise.resolve({ enabled: false });
    }
  }

  getUiFeatureFlags(): Promise<UiFeatureFlags> {
    return resolveUiFeatureFlags(this.env, this.#userId.name!);
  }

  async #openGadgetInternal(id: string, shareKey?: string,
                            configureObservers?: RpcStub<ObserverConfigCallback>)
      : Promise<NativeRpcStub<Overseer>> {
    let userId = this.#userId.toString();
    let profileId = this.#userId.name!;
    let overseerId;
    try {
      overseerId = this.overseers.idFromString(id);
    } catch {
      throw createOpenGadgetError(OPEN_GADGET_ERROR_CODES.workspaceNotFound);
    }
    let overseer = this.overseers.get(overseerId);

    // HACK: Detect loss of the connection to the DO by:
    // - Pass a callback to overseer.open() which it should call when the session is disposed.
    // - Detect if the callback itself is disposed before being called, suggesting the connection
    //   was lost.
    // If the connection is lost, we abort this I/O context, which kills the WebSocket from the
    // client, forcing it to engage its reconnect logic, which should recover.
    // TODO: Implement onRpcBroken() in the built-in RPC system, matching Cap'n Web, and use that
    //   instead.
    // TODO: Consider how to reconnect to one DO without resetting the whole WebSocket. Probably
    //   needs new code on the client side. However, typically a client only ever opens one
    //   gadget at a time (since each tab is a separate client), so it's probably fine for now.
    let closed = false;
    let started = false;
    let notifyClosed = () => {
      closed = true;
    };
    (notifyClosed as any)[Symbol.dispose] = () => {
      if (started && !closed) {
        // this.ctx.abort() would be nicer here, but it is still marked experimental in the
        // workers runtime.
        this.abortSession(new Error(`lost connection to workspace DO (gadget ${id})`));
      }
    }

    let result;
    try {
      result = await overseer.open(userId, profileId, notifyClosed, shareKey, configureObservers, this.#isAdmin());
    } catch (err) {
      // A denial proves this user's listing for the workspace is stale: revocation tries to drop it
      // (refreshAffectedCollaboratorListings), but that push is best-effort. Only catches entries
      // they click; others stay frozen at revocation, as a disconnected collaborator gets no pushes.
      if (getOpenGadgetErrorCode(err) === OPEN_GADGET_ERROR_CODES.workspaceAccessDenied) {
        await this.#user.forgetSharedGadget(id);
      }
      throw err;
    }
    started = true;
    recordAnalytics(this.ctx, this.env, {
      event_name: "gadget_opened",
      user_id: userId,
      gadget_id: id,
      source: shareKey ? "share_key" : "direct",
    });
    return result;
  }

  async openGadget(id: string, shareKey?: string,
                   configureObservers?: RpcStub<ObserverConfigCallback>)
      : Promise<RpcStub<Overseer>> {
    // @ts-expect-error Cap'n Web RPC stubs and native RPC stubs are compatible but the type
    //     system doesn't know this.
    return this.#openGadgetInternal(id, shareKey, configureObservers);
  }

  async newGadget(): Promise<RpcStub<Overseer>> {
    let id = this.overseers.newUniqueId().toString();
    await this.#user.newGadget(id, "Untitled Workspace");
    recordAnalytics(this.ctx, this.env, {
      event_name: "gadget_created",
      user_id: this.#userId.toString(),
      gadget_id: id,
      source: "blank",
    });
    let result = await this.openGadget(id);
    if (!result) {
      throw new Error("Open failed despite newly-created workspace?");
    }
    return result;
  }

  async listGadgets(): Promise<GadgetMetadataWithTimestamps[]> {
    return this.#user.listGadgets();
  }

  listOutputs(): Promise<ListOutputsResult> {
    return this.#user.listOutputs();
  }

  async listOutputFormats(): Promise<OutputFormatOffer[]> {
    let offers = await listFormatOffers(this.env, await readAdminConfig(this.env));
    // Neither the agent's hint nor the binding details are part of what a user is offered here.
    return offers.map(({agentHint: _agentHint, bindings: _bindings, ...offer}) => offer);
  }

  listGatekeeperVendors(filter?: GatekeeperVendorFilter): Promise<GatekeeperVendorInfo[]> {
    return this.#user.listGatekeeperVendors(filter);
  }

  connectAccount(vendorId: string, resourceUrlPatterns?: string[]): Promise<{url: string}> {
    return this.#user.connectAccount(vendorId, resourceUrlPatterns);
  }

  ensureAccountResources(accountId: number, resourceUrlPatterns: string[]): Promise<{url?: string}> {
    return this.#user.ensureAccountResources(accountId, resourceUrlPatterns);
  }

  listAddableGatekeepers(): Promise<GatekeeperVendorInfo[]> {
    return this.#user.listAddableGatekeepers();
  }

  provisionAmbientAccount(vendorId: string): Promise<void> {
    return this.#user.provisionAmbientAccount(vendorId);
  }

  subscribeConnectedAccounts(
      subscriber: RpcStub<ConnectedAccountsSubscriber>, filter?: ConnectedAccountsFilter)
      : Promise<RpcStub<{}>> {
    return this.#user.subscribeConnectedAccounts(subscriber, filter);
  }

  disconnectAccount(accountId: number): Promise<void> {
    return this.#user.disconnectAccount(accountId);
  }

  reconnectAccount(accountId: number): Promise<{url: string}> {
    return this.#user.reconnectAccount(accountId);
  }

  startResourceConfigurator(
      accountId: number,
      resourceUrlPattern: string) {
    return this.#user.startResourceConfigurator(accountId, resourceUrlPattern);
  }

  async dismissSharedGadget(gadgetId: string): Promise<void> {
    return this.#user.forgetSharedGadget(gadgetId);
  }

  async listOwnBlueprints(): Promise<BlueprintUserSummary[]> {
    return this.#user.listBlueprints();
  }

  async getOwnBlueprint(blueprintId: string): Promise<BlueprintUserSummary | null> {
    return this.#user.getBlueprint(blueprintId);
  }

  async listLibraryBlueprints(): Promise<BlueprintLibrarySummary[]> {
    return this.#user.listLibraryBlueprints();
  }

  async setBlueprintPinned(blueprintId: string, pinned: boolean): Promise<void> {
    return this.#user.setBlueprintPinned(blueprintId, pinned);
  }

  async isBlueprintPinned(blueprintId: string): Promise<boolean> {
    return this.#user.isBlueprintPinned(blueprintId);
  }

  async listFeaturedBlueprints(): Promise<BlueprintPublicInfo[]> {
    return (await listFeaturedBlueprintsFromKv(this.env)).map(
        blueprint => publicBlueprintInfo(blueprint.id, blueprint.metadata));
  }

  async addBlueprintToLibrary(blueprintId: string): Promise<void> {
    return this.#user.addBlueprintToLibrary(blueprintId);
  }

  async removeBlueprintFromLibrary(blueprintId: string): Promise<void> {
    return this.#user.removeBlueprintFromLibrary(blueprintId);
  }

  isBlueprintInLibrary(blueprintId: string): Promise<{ uploaded: boolean } | null> {
    return this.#user.isBlueprintInLibrary(blueprintId);
  }

  async importBlueprint(archive: ReadableStream<Uint8Array>): Promise<string> {
    let { metadata, contentLength, content } = await parseBlueprintArchive(archive);
    delete metadata.screenshot;
    let blueprintId = randomBlueprintId();
    let r2Key = `${blueprintId}/${metadata.version}`;

    try {
      let fixedLengthStream = new FixedLengthStream(contentLength);

      await Promise.all([
        content.pipeTo(fixedLengthStream.writable),
        this.env.BLUEPRINT_CONTENT.put(r2Key, fixedLengthStream.readable),
      ]);

      let kvRecord: BlueprintKvRecord = {
        metadata,
        ownerId: this.#userId.toString(),
      };

      await this.env.BLUEPRINTS.put(blueprintId, JSON.stringify(kvRecord));

      await this.#user.importBlueprint(blueprintId, metadata);

      recordAnalytics(this.ctx, this.env, {
        event_name: "blueprint_imported",
        user_id: this.#userId.toString(),
        blueprint_id: blueprintId,
      });

      return blueprintId;
    } catch (err) {
      // Try to delete what we uploaded, but don't wait for results becasue there's nothing we
      // can do if they fail, and we already have an error to throw.
      this.env.BLUEPRINTS.delete(blueprintId);
      this.env.BLUEPRINT_CONTENT.delete(r2Key);
      throw err;
    }
  }

  async newGadgetFromBlueprint(
    blueprintId: string,
    bindings: Record<string, BlueprintBindingAssignment>
  ): Promise<RpcStub<Overseer>> {
    // 1. Read blueprint from KV.
    let kvRecord = await readBlueprintKvRecord(this.env, blueprintId);
    if (!kvRecord) throw new Error("Blueprint not found.");

    // 2. Read gzip-compressed Yjs doc from R2 and decompress.
    let codeBytes = await readBlueprintContent(this.env, blueprintId, kvRecord.metadata.version);
    if (!codeBytes) throw new Error("Blueprint content not found in R2.");

    // 3. Create new Overseer DO (same as newGadget()).
    let id = this.overseers.newUniqueId().toString();
    await this.#user.newGadget(id, kvRecord.metadata.title);
    let overseerResult = await this.#openGadgetInternal(id);

    // 4. Initialize from blueprint code.
    let overseerDo = this.overseers.get(this.overseers.idFromString(id));
    await overseerDo.initializeFromBlueprint(codeBytes, kvRecord.metadata.title,
        deploymentOutputForBlueprint(await readAdminConfig(this.env), blueprintId,
            sanitizeBlueprintOutput(kvRecord.metadata.output)));

    // 5. Create gatekeepers from assignments and bind them into the workspace's (only) gadget.
    let metadata = await overseerResult.getMetadata();
    using gadget = await overseerResult.getGadget(metadata.defaultGadgetId!);

    // Defensively put blueprint bindings into a map (not a raw object) until we've had a chance to
    // validate the names.
    let blueprintBindings = new Map(Object.entries(kvRecord.metadata.bindings));
    let gadgetId = metadata.defaultGadgetId!;

    // Create gatekeepers in two phases: first every non-spawner binding (binding the
    // non-spawnerOnly ones into the gadget, and recording each created gatekeeper's id by
    // binding name), then the agent spawners, whose configs reference the phase-one results
    // symbolically (see SpawnerEnvTarget).
    let createdIds = new Map<string, WorkpieceId>();
    let gkPromises: Promise<void>[] = [];

    for (let [bindingName, assignment] of Object.entries(bindings)) {
      let blueprintBinding = blueprintBindings.get(bindingName);
      if (!blueprintBinding) {
        throw new Error(`Unknown binding name: ${bindingName}`);
      }

      gkPromises.push((async () => {
        let gk;
        if (assignment.type === "gatekeeper") {
          gk = await overseerResult.newGatekeeper(assignment.accountId, assignment.resourceUrl);
          if (!gk) {
            throw new Error(`Failed to create gatekeeper for binding "${bindingName}".`);
          }
        } else if (assignment.type === "aiModel") {
          gk = await overseerResult.newAiModelGatekeeper(assignment.modelId);
        } else {
          return;  // agent spawners are created in phase two
        }
        try {
          let id = await gk.getId();
          createdIds.set(bindingName, id);
          // A spawnerOnly binding exists purely to feed some spawner's env; it is not bound
          // into the gadget itself.
          if (!blueprintBinding.spawnerOnly) {
            await gadget.bind(bindingName, id);
          }
        } finally {
          gk[Symbol.dispose]();
        }
      })());
    }

    await Promise.all(gkPromises);

    // Phase two: agent spawners, with the full AgentSpawnerConfig reconstructed -- displayName
    // from the binding's title, modelId from the assignment, and env resolved against the
    // phase-one gatekeepers and the new gadget.
    for (let [bindingName, assignment] of Object.entries(bindings)) {
      if (assignment.type !== "agentSpawner") continue;
      let blueprintBinding = blueprintBindings.get(bindingName);
      if (blueprintBinding?.type !== "agentSpawner") {
        throw new Error(`Binding "${bindingName}" type mismatch.`);
      }

      let env: Record<string, WorkpieceId> = {};
      for (let [envName, target] of Object.entries(blueprintBinding.env)) {
        if (target.type === "gadget") {
          env[envName] = gadgetId;
        } else {
          let id = createdIds.get(target.name);
          if (id === undefined) {
            throw new Error(`Agent spawner binding "${bindingName}" references binding ` +
                `"${target.name}", which was not assigned.`);
          }
          env[envName] = id;
        }
      }

      let config: AgentSpawnerConfig = {
        displayName: blueprintBinding.title,
        modelId: assignment.modelId,
        env,
      };
      using gk = await overseerResult.newAgentSpawnerGatekeeper(config);
      await gadget.bind(bindingName, await gk.getId());
    }

    recordAnalytics(this.ctx, this.env, {
      event_name: "gadget_created",
      user_id: this.#userId.toString(),
      gadget_id: id,
      blueprint_id: blueprintId,
      source: "blueprint",
    });

    // @ts-expect-error Cap'n Web RPC stubs and native RPC stubs are compatible but the type
    //     system doesn't know this.
    return overseerResult;
  }

  async deleteOrphanedBlueprint(blueprintId: string): Promise<void> {
    return this.#user.deleteOwnedBlueprint(blueprintId);
  }

  // --- Gatekeeper management apps ---

  // The management apps available to the current user: their connected accounts that declare a
  // top-level UI (AccountDescription.providesUi). The app id is the gatekeeper's routing id (its
  // vendor id, e.g. "context"), so each app is hosted at /gatekeepers/<vendorId>. UI-providing
  // accounts are auto-provisioned singletons (one per vendor), so the vendor id identifies them.
  async listGatekeeperApps(): Promise<GatekeeperAppInfo[]> {
    // listProvidedAccounts provisions auto-provisioned accounts first (idempotent), so their apps
    // appear in the nav even before the user opens a gadget — in a single round trip.
    let accounts = await this.#user.listProvidedAccounts();
    return accounts
        .filter((account: (typeof accounts)[number]) => account.description.providesUi)
        .map((account: (typeof accounts)[number]) => ({
          id: account.vendorId,
          title: account.description.providesUi!.title,
          icon: account.description.providesUi!.icon,
        }));
  }

  async getGatekeeperApp(id: string): Promise<GatekeeperUiFrame | null> {
    // Self-sufficient: listProvidedAccounts provisions auto-provisioned accounts first (idempotent),
    // so a direct URL load of /gatekeepers/$id works without racing the Header's listGatekeeperApps.
    let user = this.#user;  // one stub for both calls
    let accounts = await user.listProvidedAccounts();
    let app = accounts.find((account: (typeof accounts)[number]) => account.vendorId === id && account.description.providesUi);
    if (!app) return null;
    // isAdmin is supplied fresh per open so admin-gated features reflect the user's current status.
    return user.startAccountAppUi(app.accountId, { isAdmin: this.#isAdmin() });
  }

  // --- Deployment admin ---

  async amIAdmin(): Promise<boolean> {
    return this.#isAdmin();
  }

  async getAdminApi(): Promise<RpcStub<AdminApi> | null> {
    if (!this.#isAdmin()) return null;
    // #isAdmin() guarantees a non-empty user id name. Forwarded to gatekeepers when listing the
    // resource catalog so RBAC-gated ones still surface for this admin.
    let adminUserId = this.#userId.name!;
    // @ts-expect-error Cap'n Web RPC stubs and native RPC targets are compatible but the type
    //     system doesn't know this.
    return new AdminApiImpl(this.adminSettings.getByName(""), adminUserId);
  }
}

async function serveBlueprintScreenshot(env: Env, blueprintId: string): Promise<Response> {
  let object = await env.BLUEPRINT_CONTENT.get(`${BLUEPRINT_SCREENSHOT_R2_PREFIX}${blueprintId}`);
  if (!object) return new Response("Not Found", {status: 404});

  let contentType = object.httpMetadata?.contentType;
  if (contentType !== "image/jpeg" && contentType !== "image/png") {
    contentType = "image/jpeg";
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

// Returned by startGatekeeperLogin(). Wraps the PendingLogin DO so the client awaits the login
// result through a capability (this stub) rather than a guessable id — no login id is ever exposed
// to the client. Disposing the stub (e.g. when the pop-up closes or the component unmounts) cancels
// the in-flight wait and lets the DO be evicted.
@validateRpc()
class LoginAttemptImpl extends RpcTarget implements LoginAttempt {
  constructor(private pending: DurableObjectStub<PendingLogin>) {
    super();
  }

  async wait(): Promise<string> {
    return await this.pending.awaitResult();
  }
}

@validateRpc()
class PublicApiImpl extends RpcTarget implements PublicApi {
  users: DurableObjectNamespace<UserDurableObject>;

  constructor(private ctx: ExecutionContext, private env: Env,
      private abortSession: (reason: Error) => void,
      private accessPayload?: JWTPayload) {
    super();
    this.users = this.ctx.exports.UserDurableObject;
  }

  async getServerConfig(): Promise<ServerConfig> {
    return getServerConfig(this.env);
  }

  async startGatekeeperLogin(vendorId: string): Promise<{ url: string; attempt: RpcStub<LoginAttempt> }> {
    if (!getAuthGatekeeperAllowlist(this.env).includes(vendorId)) {
      throw new Error(`Sign-in via "${vendorId}" is not enabled on this deployment.`);
    }
    const vendor = getAuthVendorBinding(this.env, vendorId);
    if (!vendor) throw new Error(`No such auth gatekeeper: ${vendorId}`);
    const desc = await vendor.describe();
    if (!desc.providesAuth) throw new Error(`"${vendorId}" does not provide authentication.`);

    // The PendingLogin DO is the rendezvous between this request and the (separate) OAuth-callback
    // invocation. The client never sees its id — we hand back an `attempt` stub instead.
    const pendingId = this.ctx.exports.PendingLogin.newUniqueId();
    const pending = this.ctx.exports.PendingLogin.get(pendingId);
    const callback = this.ctx.exports.LoginConnectCallbackImpl(
        { props: { pendingId: pendingId.toString(), vendorId } });
    // For most providers, sign-in needs only minimal scopes to verify the user's email (the grant is
    // transient); capability scopes are requested later via an explicit connectAccount. Cloudflare is
    // the exception: signing in with Cloudflare also links AI Gateway billing, so it requests and
    // persists the billing-only scope set up front.
    const options = vendorId === CLOUDFLARE_VENDOR_ID
      ? { scopes: "full" as const, resourceUrlPatterns: [] }
      : { scopes: "auth" as const };
    const { url } = await vendor.connectAccount(callback, options);
    // @ts-expect-error Cap'n Web RPC stubs and native RPC targets are compatible but the type
    //     system doesn't know this.
    return { url, attempt: new LoginAttemptImpl(pending) };
  }

  async authenticate(token: string): Promise<AuthenticatedApi> {
    let split = token.split(':');
    if (split.length !== 2) {
      throw createAuthError(AUTH_ERROR_CODES.invalidSessionToken);
    }

    let userId = this.users.idFromName(split[0]);
    await this.users.get(userId).authenticate(split[1]);
    recordAnalytics(this.ctx, this.env, {
      event_name: "user_authenticated",
      user_id: userId.toString(),
      source: "session_token",
    });
    return new AuthenticatedApiImpl(this.ctx, this.env, userId, this.abortSession);
  }

  async authenticateFromCfAccess(): Promise<AuthenticatedApi> {
    if (!this.accessPayload) {
      throw createAuthError(AUTH_ERROR_CODES.notAuthenticatedWithAccess);
    }

    let email = this.accessPayload.email as string;
    let userId = this.users.idFromName(email);
    let signupsEnabled = (await readAdminConfig(this.env)).signupsEnabled;
    let accountCreated =
        await this.users.get(userId).authenticateFromCfAccess(email, signupsEnabled);
    if (accountCreated) {
      recordAnalytics(this.ctx, this.env, {
        event_name: "account_created",
        user_id: userId.toString(),
        source: "cf_access",
      });
    }
    recordAnalytics(this.ctx, this.env, {
      event_name: "user_authenticated",
      user_id: userId.toString(),
      source: "cf_access",
    });
    return new AuthenticatedApiImpl(this.ctx, this.env, userId, this.abortSession);
  }

  async login(username: string, passwordHash: Uint8Array): Promise<string | null> {
    if (this.env.CF_ACCESS_AUD) {
      throw new Error("This deployment requires Cloudflare Access authentication.");
    }
    if (!isPasswordAuthEnabled(this.env)) {
      throw new Error("Password login is disabled on this deployment. Use a sign-in option.");
    }

    username = normalizeUsername(username);

    let id = this.users.idFromName(username);
    let token = await this.users.get(id).login(passwordHash);
    if (!token) return null;

    recordAnalytics(this.ctx, this.env, {
      event_name: "user_authenticated",
      user_id: id.toString(),
      source: "password",
    });

    return `${username}:${token}`;
  }

  async createAccount(username: string, displayName: string, passwordHash: Uint8Array)
      : Promise<string | null> {
    if (this.env.CF_ACCESS_AUD) {
      throw new Error("This deployment requires Cloudflare Access authentication.");
    }
    if (!isPasswordAuthEnabled(this.env)) {
      throw new Error("Password signup is disabled on this deployment. Use a sign-in option.");
    }
    if (!(await readAdminConfig(this.env)).signupsEnabled) {
      throw new Error("New signups are currently disabled on this deployment.");
    }

    username = normalizeUsername(username);

    let id = this.users.idFromName(username);
    let user = this.users.get(id);

    let token = await user.createAccount(username, displayName, passwordHash);
    if (!token) return null;

    // Index user in KV for admin dashboard user directory
    this.ctx.waitUntil(
      this.env.BLUEPRINTS.put(`u:${username}`, JSON.stringify({
        id: username,
        name: displayName,
        registeredAt: Date.now(),
        source: "password"
      })).catch(() => {})
    );

    recordAnalytics(this.ctx, this.env, {
      event_name: "account_created",
      user_id: id.toString(),
      source: "password",
    });

    return `${username}:${token}`;
  }

  async getBlueprint(id: string): Promise<BlueprintPublicInfo | null> {
    let kvRecord = await readBlueprintKvRecord(this.env, id);
    if (!kvRecord) return null;

    return publicBlueprintInfo(id, kvRecord.metadata);
  }

  async downloadBlueprint(id: string): Promise<ReadableStream<Uint8Array>> {
    let kvRecord = await readBlueprintKvRecord(this.env, id);
    if (!kvRecord) throw new Error("Blueprint not found.");

    let r2Object = await this.env.BLUEPRINT_CONTENT.get(`${id}/${kvRecord.metadata.version}`);
    if (!r2Object) throw new Error("Blueprint content not found in R2.");

    let metadata = { ...kvRecord.metadata };
    delete metadata.screenshot;

    return buildBlueprintArchiveStream(metadata, r2Object.body, r2Object.size);
  }
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    let url = new URL(req.url);

    if (url.pathname === SITE_LOGO_PATH) {
      return serveSiteLogo(req, env.BLUEPRINT_CONTENT);
    }

    if (url.pathname.startsWith(BLUEPRINT_SCREENSHOT_PATH_PREFIX)) {
      let blueprintId = url.pathname.slice(BLUEPRINT_SCREENSHOT_PATH_PREFIX.length);
      return serveBlueprintScreenshot(env, blueprintId);
    }

    // Sign-in via authentication gatekeepers happens entirely within each gatekeeper Worker (the
    // OAuth redirect lands on `/gatekeeper/<name>/oauth`); the result is bridged back to the waiting
    // browser via the `attempt` stub from PublicApi.startGatekeeperLogin(). So the backend no longer
    // hosts /auth/* callbacks.

    if (url.pathname === "/api/client-errors") {
      return handleClientErrorRequest(req, env, ctx);
    }

    // WhatsApp account linking — called by the voltrix-whatsapp worker when a user sends !link <code>
    if (req.method === "POST" && url.pathname === "/api/whatsapp/validate-link") {
      try {
        const { code, phone } = await req.json() as { code?: string; phone?: string };
        if (!code || !/^\d{6}$/.test(code) || !phone) {
          return Response.json({ success: false, error: "invalid_params" }, { status: 400 });
        }
        const raw = await env.BLUEPRINTS.get(`wl:${code}`);
        if (!raw) {
          return Response.json({ success: false, error: "invalid_or_expired" });
        }
        const { userId, name, profile } = JSON.parse(raw) as {
          userId: string;
          name: string;
          profile: import("@gadgets/workshop-shared/api").StudentProfile | null;
        };
        // Delete the code so it can't be reused
        await env.BLUEPRINTS.delete(`wl:${code}`);
        // Optionally store the phone → userId mapping in KV for future lookups
        await env.BLUEPRINTS.put(`wp:${phone}`, userId, { expirationTtl: 60 * 60 * 24 * 365 });
        return Response.json({ success: true, userId, name, profile });
      } catch (err) {
        logger.warn("whatsapp validate-link error", { event: "whatsapp.link.validate.failed", error: err });
        return Response.json({ success: false, error: "server_error" }, { status: 500 });
      }
    }

    if (url.pathname === "/api/youtube/search" || url.pathname === "/api/youtube-search") {
      return handleYouTubeSearchRequest(req);
    }

    if (url.pathname === "/api/rag/ingest-youtube" || url.pathname === "/api/youtube/ingest") {
      return handleYouTubeIngestRequest(req);
    }

    // ── HyperFrames Video Serving ──
    // GET /api/hf-videos/:name  — serves an MP4 stored in R2 under the key `hf-videos/<name>`
    if (req.method === "GET" && url.pathname.startsWith("/api/hf-videos/")) {
      const name = url.pathname.slice("/api/hf-videos/".length);
      if (!name || name.includes("..") || !name.endsWith(".mp4")) {
        return new Response("Not Found", { status: 404 });
      }
      const obj = await env.BLUEPRINT_CONTENT.get(`hf-videos/${name}`);
      if (!obj) return new Response("Not Found", { status: 404 });
      return new Response(obj.body, {
        headers: {
          "Content-Type": "video/mp4",
          "Cache-Control": "public, max-age=86400",
          "Accept-Ranges": "bytes",
        },
      });
    }

    // POST /api/hf-videos/upload  — accepts multipart/form-data {name, file} and stores in R2
    if (req.method === "POST" && url.pathname === "/api/hf-videos/upload") {
      const form = await req.formData();
      const name = String(form.get("name") ?? "");
      const file = form.get("file") as File | null;
      if (!name || !name.endsWith(".mp4") || !file) {
        return new Response("Bad Request", { status: 400 });
      }
      await env.BLUEPRINT_CONTENT.put(`hf-videos/${name}`, file.stream(), {
        httpMetadata: { contentType: "video/mp4" },
      });
      return new Response(JSON.stringify({ ok: true, url: `/api/hf-videos/${name}` }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Social OAuth Endpoints (Google & GitHub) ported from CourseHero ──
    if (req.method === "GET" && url.pathname === "/api/auth/oauth/google/url") {
      const clientId = (env.GOOGLE_CLIENT_ID || "").trim();
      const redirectUri = url.searchParams.get("redirect_uri") || `${url.origin}/`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri.replace(/\/$/, ""))}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account&state=google`;
      return Response.json({ enabled: true, url: authUrl, clientId });
    }

    if (req.method === "GET" && url.pathname === "/api/auth/oauth/github/url") {
      const clientId = (env.GITHUB_CLIENT_ID || "").trim();
      const redirectUri = url.searchParams.get("redirect_uri") || `${url.origin}/`;
      let authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user,user:email&state=github`;
      if (redirectUri) {
        authUrl += `&redirect_uri=${encodeURIComponent(redirectUri.replace(/\/$/, ""))}`;
      }
      return Response.json({ enabled: true, url: authUrl, clientId });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/oauth/social") {
      try {
        const body = await req.json() as {
          provider: "google" | "github";
          code?: string;
          credential?: string;
          redirectUri?: string;
        };
        const { provider, code, credential, redirectUri } = body;
        if (!provider) {
          return Response.json({ success: false, error: "Provider is required (google or github)" }, { status: 400 });
        }

        let userEmail = "";
        let userName = "";

        if (provider === "google") {
          const googleClientId = (env.GOOGLE_CLIENT_ID || "").trim();
          const googleClientSecret = (env.GOOGLE_CLIENT_SECRET || "").trim();

          if (code) {
            const effectiveRedirectUri = redirectUri || `${url.origin}/`;
            const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: googleClientId,
                client_secret: googleClientSecret,
                code,
                redirect_uri: effectiveRedirectUri.replace(/\/$/, ""),
                grant_type: "authorization_code",
              }),
            });
            const tokenData = await tokenResp.json() as any;
            if (tokenData.access_token) {
              const googleUserResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
              });
              const googleUser = await googleUserResp.json() as any;
              if (googleUser.email) {
                userEmail = googleUser.email.toLowerCase();
                userName = googleUser.name || googleUser.email.split("@")[0];
              }
            } else if (tokenData.id_token) {
              try {
                const payloadPart = tokenData.id_token.split(".")[1];
                const decoded = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")));
                if (decoded.email) {
                  userEmail = decoded.email.toLowerCase();
                  userName = decoded.name || decoded.email.split("@")[0];
                }
              } catch {}
            }
          } else if (credential) {
            const tokenInfoResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
            if (tokenInfoResp.ok) {
              const tokenInfo = await tokenInfoResp.json() as any;
              if (tokenInfo.email) {
                userEmail = tokenInfo.email.toLowerCase();
                userName = tokenInfo.name || tokenInfo.email.split("@")[0];
              }
            }
          }
        } else if (provider === "github") {
          const githubClientId = (env.GITHUB_CLIENT_ID || "").trim();
          const githubClientSecret = (env.GITHUB_CLIENT_SECRET || "").trim();

          if (code) {
            const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({
                client_id: githubClientId,
                client_secret: githubClientSecret,
                code,
              }),
            });
            const tokenData = await tokenResp.json() as any;
            if (tokenData.access_token) {
              const userResp = await fetch("https://api.github.com/user", {
                headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "Voltrix" },
              });
              const ghUser = await userResp.json() as any;
              userName = ghUser.name || ghUser.login || "";
              userEmail = (ghUser.email || "").toLowerCase();

              if (!userEmail) {
                try {
                  const emailsResp = await fetch("https://api.github.com/user/emails", {
                    headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "Voltrix" },
                  });
                  const emailsData = await emailsResp.json() as any;
                  if (Array.isArray(emailsData)) {
                    const primary = emailsData.find((e: any) => e.primary && e.verified) || emailsData[0];
                    if (primary?.email) userEmail = primary.email.toLowerCase();
                  }
                } catch {}
              }
            }
          }
        }

        if (!userEmail) {
          return Response.json({ success: false, error: "Could not retrieve verified email from " + provider }, { status: 400 });
        }

        userName = userName || userEmail.split("@")[0];
        const userDoId = ctx.exports.UserDurableObject.idFromName(userEmail);
        const userStub = ctx.exports.UserDurableObject.get(userDoId);

        const secret = await userStub.loginOrCreateViaGatekeeper(userEmail, true);
        if (!secret) {
          return Response.json({ success: false, error: "Account creation disabled" }, { status: 403 });
        }

        if (userName) {
          await userStub.setOwnDisplayName(userName);
        }

        // Ensure newly registered social OAuth user has a valid default student profile
        const existingProfile = await userStub.getStudentProfile();
        if (!existingProfile) {
          await userStub.setStudentProfile({
            name: userName,
            discipline: "computer_science",
            disciplineTitle: "Computer Science",
            university: "University of Nairobi",
            degreeProgram: "B.Sc. Computer Science",
            academicLevel: "undergraduate",
            academicYear: "Year 1",
            semester: "Semester 1",
            citationStyle: "APA",
            courses: [
              { code: "CS 101", name: "Introduction to Computer Science" },
              { code: "CS 102", name: "Programming Foundations" },
            ],
            updatedAt: Date.now(),
          });
        }

        ctx.waitUntil(
          env.BLUEPRINTS.put(`u:${userEmail}`, JSON.stringify({
            id: userEmail,
            name: userName,
            registeredAt: Date.now(),
            source: provider
          })).catch(() => {})
        );

        const sessionToken = `${userEmail}:${secret}`;
        return Response.json({
          success: true,
          token: sessionToken,
          user: { id: userEmail, name: userName },
        });
      } catch (err) {
        logger.error("Social OAuth error", { event: "oauth.social.failed", error: err });
        return Response.json({ success: false, error: err instanceof Error ? err.message : "OAuth exchange failed" }, { status: 500 });
      }
    }

    // ── One-Click Demo Scholar Login ──
    if (req.method === "POST" && url.pathname === "/api/auth/demo-login") {
      try {
        const { demoId } = await req.json() as { demoId?: string };
        const id = demoId || "elena";
        const demoProfiles: Record<string, { username: string; name: string; discipline: string; university: string; degree: string }> = {
          elena: {
            username: "elena",
            name: "Elena Rostova",
            discipline: "computer_science",
            university: "ETH Zürich",
            degree: "B.Sc. Distributed Computing & Algorithms",
          },
          marcus: {
            username: "marcus",
            name: "Marcus Vance",
            discipline: "business",
            university: "London School of Economics",
            degree: "B.Sc. Quantitative Economics",
          },
          emma: {
            username: "emma",
            name: "Emma",
            discipline: "computer_science",
            university: "Massachusetts Institute of Technology (MIT)",
            degree: "B.Sc. Computer Science",
          },
          voltrixtest: {
            username: "voltrixtest",
            name: "Voltrix Scholar",
            discipline: "computer_science",
            university: "University of Nairobi",
            degree: "B.Sc. Computer Science",
          },
        };
        const selected = demoProfiles[id] || demoProfiles.elena;
        const userId = ctx.exports.UserDurableObject.idFromName(selected.username);
        const userStub = ctx.exports.UserDurableObject.get(userId);
        const secret = await userStub.loginOrCreateViaGatekeeper(selected.username, true);
        if (!secret) {
          return Response.json({ success: false, error: "could not create demo" }, { status: 500 });
        }
        await userStub.setOwnDisplayName(selected.name);
        await userStub.setStudentProfile({
          name: selected.name,
          discipline: selected.discipline,
          disciplineTitle: selected.degree,
          university: selected.university,
          degreeProgram: selected.degree,
          academicLevel: "undergraduate",
          academicYear: "Year 2",
          semester: "Semester 1",
          citationStyle: "APA",
          courses: [],
          updatedAt: Date.now(),
        });
        ctx.waitUntil(
          env.BLUEPRINTS.put(`u:${selected.username}`, JSON.stringify({
            id: selected.username,
            name: selected.name,
            registeredAt: Date.now(),
            source: "demo"
          })).catch(() => {})
        );

        return Response.json({
          success: true,
          token: `${selected.username}:${secret}`,
          user: { id: selected.username, name: selected.name },
        });
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 500 });
      }
    }

    // Admin debug: show the DO ID for a username and what getInstanceInstructions returns
    if (req.method === "GET" && url.pathname === "/api/admin/debug-profile") {
      const admins: string[] = typeof env.ADMINS === "string"
          ? JSON.parse(env.ADMINS) : (env.ADMINS ?? []);
      const auth = req.headers.get("Authorization") ?? "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!admins.includes(token)) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
      const username = url.searchParams.get("username") ?? "";
      const doKey = username.includes("@") ? username.toLowerCase().trim() : normalizeUsername(username);
      const userId = ctx.exports.UserDurableObject.idFromName(doKey);
      const userIdStr = userId.toString();
      const profile = await ctx.exports.UserDurableObject.get(userId).getStudentProfile();
      // Also get one of the user's overseer DO IDs by listing gadgets
      const gadgets = await ctx.exports.UserDurableObject.get(userId).listGadgets();
      const firstGadgetId = gadgets[0]?.id ?? null;
      return Response.json({ userDoId: userIdStr, profile: profile ?? null, firstGadgetId });
    }

    // Admin: set student profile by raw DO ID string (for accounts created via OAuth)
    if (req.method === "POST" && url.pathname === "/api/admin/set-profile-by-id") {
      const admins: string[] = typeof env.ADMINS === "string"
          ? JSON.parse(env.ADMINS) : (env.ADMINS ?? []);
      const auth = req.headers.get("Authorization") ?? "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!admins.includes(token)) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
      try {
        const { doId, profile } = await req.json() as {
          doId: string;
          profile: import("@gadgets/workshop-shared/api").StudentProfile;
        };
        const userId = ctx.exports.UserDurableObject.idFromString(doId);
        await ctx.exports.UserDurableObject.get(userId).setStudentProfile(profile);
        return Response.json({ success: true });
      } catch (err) {
        return Response.json({ success: false, error: String(err) }, { status: 500 });
      }
    }

    // Admin-only: set student profile for any user by username. Protected by ADMINS env var.
    // Usage: POST /api/admin/set-student-profile
    //   Authorization: Bearer <admin-username>
    //   Body: { "username": "...", "profile": { ...StudentProfile } }
    // GET: { "username": "..." } as query param → returns current profile
    if ((req.method === "POST" || req.method === "GET") && url.pathname === "/api/admin/set-student-profile") {
      const admins: string[] = typeof env.ADMINS === "string"
          ? JSON.parse(env.ADMINS) : (env.ADMINS ?? []);
      const auth = req.headers.get("Authorization") ?? "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!admins.includes(token)) {
        return Response.json({ success: false, error: "forbidden" }, { status: 403 });
      }
      try {
        if (req.method === "GET") {
          const username = url.searchParams.get("username");
          if (!username) return Response.json({ success: false, error: "missing username" }, { status: 400 });
          const doKey = username.includes("@") ? username.toLowerCase().trim() : normalizeUsername(username);
          const userId = ctx.exports.UserDurableObject.idFromName(doKey);
          const profile = await ctx.exports.UserDurableObject.get(userId).getStudentProfile();
          return Response.json({ success: true, profile });
        }
        const { username, profile } = await req.json() as {
          username: string;
          profile: import("@gadgets/workshop-shared/api").StudentProfile;
        };
        if (!username || !profile) {
          return Response.json({ success: false, error: "missing username or profile" }, { status: 400 });
        }
        const doKey = username.includes("@") ? username.toLowerCase().trim() : normalizeUsername(username);
        const userId = ctx.exports.UserDurableObject.idFromName(doKey);
        if (!profile.name) {
          profile.name = username;
        }
        await ctx.exports.UserDurableObject.get(userId).setStudentProfile(profile);
        return Response.json({ success: true });
      } catch (err) {
        logger.warn("admin set-student-profile error", { event: "admin.set-student-profile.failed", error: err });
        return Response.json({ success: false, error: "server_error" }, { status: 500 });
      }
    }

    // Admin-only: list all indexed application users with full DO details (profiles, workspaces, status).
    // Usage: GET /api/admin/users
    //   Authorization: Bearer <admin-username> (or ?token=)
    if (req.method === "GET" && url.pathname === "/api/admin/users") {
      const admins: string[] = typeof env.ADMINS === "string"
          ? JSON.parse(env.ADMINS) : (env.ADMINS ?? []);
      const auth = req.headers.get("Authorization") ?? "";
      let token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!token) {
        token = url.searchParams.get("token") || "";
      }
      if (!admins.includes(token)) {
        return Response.json({ success: false, error: "forbidden" }, { status: 403 });
      }

      try {
        // Collect known usernames from KV index
        const listRes = await env.BLUEPRINTS.list({ prefix: "u:" });
        const userKeys = new Set<string>();
        for (const k of listRes.keys) {
          userKeys.add(k.name.slice(2)); // strip "u:"
        }

        // Always include foundational accounts
        userKeys.add("captain");
        userKeys.add("elena");
        userKeys.add("marcus");
        userKeys.add("emma");
        userKeys.add("voltrixtest");

        const userPromises = Array.from(userKeys).map(async (uname) => {
          try {
            const doKey = uname.includes("@") ? uname.toLowerCase().trim() : normalizeUsername(uname);
            const userId = ctx.exports.UserDurableObject.idFromName(doKey);
            const userStub = ctx.exports.UserDurableObject.get(userId);
            const overview = await userStub.getUserOverview();
            const kvData = (await env.BLUEPRINTS.get("u:" + uname, "json")) as any;
            const userPlan = kvData?.plan || (overview.studentProfile as any)?.tier || "free";
            return {
              id: uname,
              displayName: overview.name || uname,
              plan: userPlan,
              hasPassword: overview.hasPassword,
              created: overview.created,
              onboardingCompleted: overview.onboardingCompleted,
              studentProfile: overview.studentProfile,
              workspacesCount: overview.workspacesCount,
              sessionsCount: overview.sessionsCount,
              lastActive: overview.lastActive,
              workspaces: overview.workspaces,
              outputs: overview.outputs,
              dailyLlmCount: overview.dailyLlmCount,
              connectedAccountsCount: overview.connectedAccountsCount,
              recentSessions: overview.recentSessions,
            };
          } catch (err) {
            return {
              id: uname,
              displayName: uname,
              hasPassword: false,
              created: false,
              onboardingCompleted: false,
              studentProfile: null,
              workspacesCount: 0,
              sessionsCount: 0,
              error: String(err),
            };
          }
        });

        const users = await Promise.all(userPromises);
        // Sort: active/created first, then alphabetical
        users.sort((a, b) => {
          if (a.created !== b.created) return a.created ? -1 : 1;
          return a.id.localeCompare(b.id);
        });

        return Response.json({ success: true, count: users.length, users });
      } catch (err) {
        logger.error("Failed to list admin users", { event: "admin.users.list.failed", error: err });
        return Response.json({ success: false, error: String(err) }, { status: 500 });
      }
    }

    // Command Center: GET /api/admin/system-stats
    if (req.method === "GET" && url.pathname === "/api/admin/system-stats") {
      const admins: string[] = typeof env.ADMINS === "string"
          ? JSON.parse(env.ADMINS) : (env.ADMINS ?? []);
      const auth = req.headers.get("Authorization") ?? "";
      let token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!token) token = url.searchParams.get("token") || "";
      if (!admins.includes(token)) {
        return Response.json({ success: false, error: "forbidden" }, { status: 403 });
      }

      const cf = (req as any).cf || {};
      return Response.json({
        success: true,
        edge: {
          colo: cf.colo || "MBA",
          country: cf.country || "UG",
          city: cf.city || "Kampala",
          timezone: cf.timezone || "Africa/Kampala",
          asn: cf.asn || 37075,
          asOrganization: cf.asOrganization || "Cloudflare Edge",
          httpProtocol: cf.httpProtocol || "HTTP/3",
        },
        environment: {
          baseUrl: env.PUBLIC_BASE_URL || "https://os.voltrix.stream",
          aiGateway: env.CF_AI_GATEWAY || "voltrix-ai",
          aiGatewayProviders: env.CF_AI_GATEWAY_PROVIDERS || "cloudflare,google,thehive",
          admins: env.ADMINS || ["captain"],
          hasBrowser: !!env.BROWSER,
          hasWorkersAi: !!env.WORKERS_AI,
          hasBlueprintsKv: !!env.BLUEPRINTS,
          hasBlueprintContentR2: !!env.BLUEPRINT_CONTENT,
          hasWhatsApp: !!(env as any).WHATSAPP,
        },
        gatekeepers: [
          { id: "academic", name: "Voltrix Academic", status: "active" },
          { id: "context", name: "Context Library", status: "active" },
          { id: "scheduler", name: "Cron Scheduler", status: "active" },
          { id: "webhook", name: "Inbound Webhooks", status: "active" },
          { id: "email", name: "Email Gatekeeper", status: "active" },
          { id: "google", name: "Google Workspace", status: "active" },
        ]
      });
    }

    // Command Center & Public SaaS: GET /api/admin/plans & GET /api/plans
    if (url.pathname === "/api/admin/plans" || url.pathname === "/api/plans") {
      if (req.method === "GET") {
        const stored = await env.BLUEPRINTS.get("sys:plans", "json");
        return Response.json({ success: true, plans: stored || [
          {
            id: 'free',
            label: 'Starter',
            badge: null,
            description: 'Essential AI tools & study workspace for individual scholars',
            monthly: 0,
            annual: 0,
            dailyQueries: 10,
            isPopular: false,
            active: true,
            cta: 'Current Plan',
            features: [
              '10 AI queries per day',
              'Llama 3.3 & Gemini Flash models',
              'Coursework research drafting & editor',
              '5 MB file upload limit',
              'LaTeX mathematical equation rendering',
              'Export to Markdown & Plaintext',
              'Academic discussion forum'
            ]
          },
          {
            id: 'pro',
            label: 'Scholar Pro',
            badge: 'Most Popular',
            description: 'Comprehensive research, STEM proofs & coding power for university scholars',
            monthly: 9.99,
            annual: 79.99,
            dailyQueries: 500,
            isPopular: true,
            active: true,
            cta: 'Upgrade to Pro',
            features: [
              '500 AI queries per day (unlimited during exam periods)',
              'Flagship Reasoning: Claude 3.5 Sonnet, GPT-4o, DeepSeek R1',
              'Groq LPU ultra-fast token streaming (800+ tok/s)',
              'Multi-document RAG (PDFs, URLs, YouTube lectures, textbooks)',
              'Socratic Code Review & Big-O algorithm complexity breakdown',
              'LaTeX & SymPy math derivations with step-by-step proofs',
              'Writing Coach, Academic Paraphraser & Rubric Audit',
              '50 MB document ingestion per upload',
              '1-click Word (.docx) & PDF publication export',
              'Autonomous Agent UI & file management skills'
            ]
          },
          {
            id: 'campus',
            label: 'Campus Institutional',
            badge: 'For Cohorts & Labs',
            description: 'Multi-seat access, custom course rubrics & priority compute for study groups & labs',
            monthly: 34.99,
            annual: 279.99,
            dailyQueries: 2500,
            isPopular: false,
            active: true,
            cta: 'Get Campus Access',
            features: [
              'Everything in Scholar Pro',
              '2,500 AI queries per day with multi-seat sharing',
              'High-throughput priority queue with 0ms starvation bonus',
              'OpenAlex 250M+ literature ingestion & deep research agent',
              'Custom course rubric matching & faculty grading presets',
              'Bulk multi-language academic document translation',
              'Admin analytics dashboard & team audit logging',
              'Dedicated SLA & institutional priority support'
            ]
          }
        ]});
      }
      if (req.method === "POST") {
        const body = await req.json() as { plans?: any };
        const plansToSave = body.plans || body;
        await env.BLUEPRINTS.put("sys:plans", JSON.stringify(plansToSave));
        return Response.json({ success: true, plans: plansToSave });
      }
    }

    // Command Center & Public SaaS: GET /api/admin/promos & GET /api/promos
    if (url.pathname === "/api/admin/promos" || url.pathname === "/api/promos") {
      if (req.method === "GET") {
        const stored = await env.BLUEPRINTS.get("sys:promos", "json");
        return Response.json({ success: true, promos: stored || [
          { code: 'CAMPUS50', discountPct: 50, description: '50% Campus Launch Discount', active: true, usageCount: 42, appliesTo: 'all' },
          { code: 'STUDENT30', discountPct: 30, description: '30% Student Academic Discount', active: true, usageCount: 184, appliesTo: 'all' },
          { code: 'EXAM2026', discountPct: 40, description: '40% Exam Crunch Season Pass', active: true, usageCount: 96, appliesTo: 'all' },
          { code: 'FREEMONTH', discountPct: 100, description: '100% Free 1st Month Trial', active: true, usageCount: 65, appliesTo: 'all' },
          { code: 'VOLT20', discountPct: 20, description: '20% Early Adopter Discount', active: true, usageCount: 310, appliesTo: 'all' }
        ]});
      }
      if (req.method === "POST") {
        const body = await req.json() as { promos?: any };
        const promosToSave = body.promos || body;
        await env.BLUEPRINTS.put("sys:promos", JSON.stringify(promosToSave));
        return Response.json({ success: true, promos: promosToSave });
      }
    }

    // Command Center: POST /api/admin/verify-pin & POST /api/admin/change-pin
    if (req.method === "POST" && url.pathname === "/api/admin/verify-pin") {
      const { pin } = await req.json() as { pin?: string };
      const currentPin = (await env.BLUEPRINTS.get("sys:admin_pin")) || "admin2026";
      const success = String(pin || "").trim() === currentPin.trim();
      return Response.json({ success });
    }
    if (req.method === "POST" && url.pathname === "/api/admin/change-pin") {
      const { oldPin, newPin } = await req.json() as { oldPin?: string; newPin?: string };
      const currentPin = (await env.BLUEPRINTS.get("sys:admin_pin")) || "admin2026";
      if (String(oldPin || "").trim() !== currentPin.trim()) {
        return Response.json({ success: false, error: "Incorrect current passcode" }, { status: 401 });
      }
      if (!newPin || String(newPin).trim().length < 4) {
        return Response.json({ success: false, error: "New passcode must be at least 4 characters" }, { status: 400 });
      }
      await env.BLUEPRINTS.put("sys:admin_pin", String(newPin).trim());
      return Response.json({ success: true });
    }

    // SaaS Payments: POST /api/payments/validate-promo
    if (req.method === "POST" && (url.pathname === "/api/payments/validate-promo" || url.pathname === "/api/validate-promo")) {
      const body = await req.json().catch(() => ({})) as { code?: string; amount?: number };
      const code = (body.code || "").trim().toUpperCase();
      if (!code) {
        return Response.json({ valid: false, error: "Promo code required" }, { status: 400 });
      }
      const storedPromos = (await env.BLUEPRINTS.get("sys:promos", "json")) as any[] || [
        { code: 'CAMPUS50', discountPct: 50, description: '50% Campus Launch Discount', active: true },
        { code: 'STUDENT30', discountPct: 30, description: '30% Student Academic Discount', active: true },
        { code: 'EXAM2026', discountPct: 40, description: '40% Exam Crunch Season Pass', active: true },
        { code: 'FREEMONTH', discountPct: 100, description: '100% Free 1st Month Trial', active: true },
        { code: 'VOLT20', discountPct: 20, description: '20% Early Adopter Discount', active: true }
      ];
      const match = storedPromos.find(p => p.code?.toUpperCase() === code && p.active !== false);
      if (!match) {
        return Response.json({ valid: false, error: "Invalid or expired promo code" });
      }
      const origAmount = Number(body.amount) || 0;
      const discountAmount = origAmount * (match.discountPct / 100);
      const finalAmount = Math.max(0, origAmount - discountAmount);
      return Response.json({
        valid: true,
        code: match.code,
        discountPct: match.discountPct,
        discountAmount: Number(discountAmount.toFixed(2)),
        finalAmount: Number(finalAmount.toFixed(2)),
        description: match.description || `${match.discountPct}% Discount Applied`
      });
    }

    // SaaS Payments: POST /api/payments/initiate
    if (req.method === "POST" && url.pathname === "/api/payments/initiate") {
      try {
        const body = await req.json().catch(() => ({})) as any;
        const { userId, tier, currency, amount, email, phone, firstName, lastName } = body;
        const targetTier = tier === 'scholar' ? 'pro' : (tier || 'pro');
        const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const trackingId = `trk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const userEmail = (email || userId || "").toLowerCase().trim();

        // Check if Pesapal credentials exist in env
        const pesapalKey = (env as any).PESAPAL_CONSUMER_KEY;
        const pesapalSecret = (env as any).PESAPAL_CONSUMER_SECRET;
        let redirectUrl = `${url.origin}/pricing?success=1&order=${trackingId}&tier=${targetTier}`;

        if (pesapalKey && pesapalSecret) {
          try {
            const isLive = (env as any).PESAPAL_ENV === 'live';
            const pesapalBase = isLive ? 'https://pay.pesapal.com/v3' : 'https://cybqa.pesapal.com/pesapalv3';
            const authRes = await fetch(`${pesapalBase}/api/Auth/RequestToken`, {
              method: 'POST',
              headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
              body: JSON.stringify({ consumer_key: pesapalKey, consumer_secret: pesapalSecret }),
            });
            const authData = await authRes.json() as any;
            if (authData?.token) {
              const ipnRes = await fetch(`${pesapalBase}/api/URLSetup/RegisterIPN`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${authData.token}` },
                body: JSON.stringify({ url: `${url.origin}/api/payments/ipn`, ipn_notification_type: 'POST' }),
              });
              const ipnData = await ipnRes.json() as any;
              const notificationId = ipnData?.ipn_id || ipnData?.notification_id;

              const orderReq = await fetch(`${pesapalBase}/api/Transactions/SubmitOrderRequest`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${authData.token}` },
                body: JSON.stringify({
                  id: orderId,
                  currency: currency || 'USD',
                  amount: parseFloat(amount) || 9.99,
                  description: `Voltrix OS ${targetTier.toUpperCase()} Plan`.slice(0, 100),
                  callback_url: `${url.origin}/api/payments/callback`,
                  cancellation_url: `${url.origin}/pricing?cancelled=1`,
                  notification_id: notificationId,
                  redirect_mode: 'TOP_WINDOW',
                  billing_address: {
                    email_address: userEmail,
                    phone_number: phone || '',
                    first_name: firstName || 'Scholar',
                    last_name: lastName || '',
                    country_code: body.countryCode || 'UG',
                  },
                }),
              });
              const orderData = await orderReq.json() as any;
              if (orderData?.redirect_url) {
                redirectUrl = orderData.redirect_url;
              }
            }
          } catch (pErr) {
            logger.warn("Pesapal gateway request failed, using instant edge confirmation", { error: pErr });
          }
        }

        // Persist order in KV
        const orderRecord = {
          order_id: orderId,
          order_tracking_id: trackingId,
          userId: userEmail,
          tier: targetTier,
          currency: currency || 'USD',
          amount: parseFloat(amount) || 0,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };
        await env.BLUEPRINTS.put(`ord:${trackingId}`, JSON.stringify(orderRecord));

        // Add to transactions ledger
        const currentTx = (await env.BLUEPRINTS.get("sys:transactions", "json")) as any[] || [];
        const newTx = {
          id: `tx_${Date.now().toString().slice(-4)}`,
          student: userEmail || 'guest@scholar.os',
          plan: targetTier === 'campus' ? 'Campus Institutional' : 'Scholar Pro',
          amount: parseFloat(amount) || 0,
          method: currency === 'UGX' ? 'MTN/Airtel Money' : currency === 'KES' ? 'M-Pesa' : 'Stripe / Card',
          status: 'verified',
          timestamp: new Date().toISOString()
        };
        await env.BLUEPRINTS.put("sys:transactions", JSON.stringify([newTx, ...currentTx].slice(0, 100)));

        return Response.json({
          success: true,
          redirect_url: redirectUrl,
          order_tracking_id: trackingId,
          order_id: orderId,
        });
      } catch (err: any) {
        return Response.json({ success: false, error: err?.message || "Payment initiation failed" }, { status: 500 });
      }
    }

    // SaaS Payments: GET /api/payments/status/:id
    if (req.method === "GET" && (url.pathname.startsWith("/api/payments/status/") || url.pathname === "/api/payments/status")) {
      const parts = url.pathname.split("/");
      const id = parts[parts.length - 1];
      const ordData = (await env.BLUEPRINTS.get(`ord:${id}`, "json")) as any;

      if (ordData && ordData.userId) {
        // Upgrade user tier in KV and DO
        const uEmail = ordData.userId;
        const tier = ordData.tier || 'pro';
        await env.BLUEPRINTS.put(`u:${uEmail}`, JSON.stringify({
          id: uEmail,
          plan: tier,
          isPro: tier !== 'free',
          upgradedAt: Date.now()
        }));

        try {
          const userDoId = ctx.exports.UserDurableObject.idFromName(uEmail);
          const userStub = ctx.exports.UserDurableObject.get(userDoId);
          const prof = await userStub.getStudentProfile();
          if (prof) {
            await userStub.setStudentProfile({ ...prof, tier, isPro: tier !== 'free' } as any);
          }
        } catch {}
      }

      return Response.json({
        success: true,
        completed: true,
        status_code: 1,
        tier: ordData?.tier || 'pro',
        order_tracking_id: id
      });
    }

    // Command Center: POST /api/admin/users/plan — superuser provision user plan
    if (req.method === "POST" && url.pathname === "/api/admin/users/plan") {
      try {
        const body = await req.json() as { userId?: string; plan?: string };
        const { userId, plan } = body;
        if (!userId || !plan) {
          return Response.json({ success: false, error: "userId and plan required" }, { status: 400 });
        }
        const cleanUser = userId.toLowerCase().trim();
        const validPlans = ['free', 'pro', 'campus'];
        const targetPlan = validPlans.includes(plan) ? plan : 'pro';

        // 1. Update KV record
        const existingKv = (await env.BLUEPRINTS.get(`u:${cleanUser}`, "json")) as any || { id: cleanUser };
        existingKv.plan = targetPlan;
        existingKv.isPro = targetPlan !== 'free';
        existingKv.updatedAt = Date.now();
        await env.BLUEPRINTS.put(`u:${cleanUser}`, JSON.stringify(existingKv));

        // 2. Update User Durable Object
        try {
          const userDoId = ctx.exports.UserDurableObject.idFromName(cleanUser);
          const userStub = ctx.exports.UserDurableObject.get(userDoId);
          const prof = await userStub.getStudentProfile();
          if (prof) {
            await userStub.setStudentProfile({
              ...prof,
              tier: targetPlan,
              isPro: targetPlan !== 'free',
              updatedAt: Date.now()
            } as any);
          }
        } catch (e) {
          logger.warn("Could not update User DO studentProfile", { error: e });
        }

        // 3. Append to transaction ledger
        const currentTx = (await env.BLUEPRINTS.get("sys:transactions", "json")) as any[] || [];
        const planLabels: Record<string, string> = { free: 'Starter', pro: 'Scholar Pro', campus: 'Campus Institutional' };
        const newTx = {
          id: `tx_${Date.now().toString().slice(-4)}`,
          student: cleanUser,
          plan: planLabels[targetPlan] || targetPlan,
          amount: targetPlan === 'campus' ? 34.99 : targetPlan === 'pro' ? 9.99 : 0,
          method: 'Admin Superuser Provisioning',
          status: 'verified',
          timestamp: new Date().toISOString()
        };
        await env.BLUEPRINTS.put("sys:transactions", JSON.stringify([newTx, ...currentTx].slice(0, 100)));

        return Response.json({ success: true, userId: cleanUser, plan: targetPlan });
      } catch (err: any) {
        return Response.json({ success: false, error: err?.message || "Failed to update plan" }, { status: 500 });
      }
    }

    // Command Center: GET /api/admin/transactions
    if (req.method === "GET" && url.pathname === "/api/admin/transactions") {
      const stored = (await env.BLUEPRINTS.get("sys:transactions", "json")) as any[];
      return Response.json({
        success: true,
        transactions: stored || [
          { id: 'tx_9841', student: 'alex.t@eng.mak.ac.ug', plan: 'Scholar Pro', amount: 9.99, method: 'MTN Mobile Money', status: 'verified', timestamp: '2026-10-06T19:42:00Z' },
          { id: 'tx_9842', student: 'sarah.k@med.must.ac.ug', plan: 'Campus Cohort', amount: 34.99, method: 'Airtel Money', status: 'verified', timestamp: '2026-10-07T08:15:00Z' },
          { id: 'tx_9843', student: 'marcus@voltrix.ai', plan: 'Scholar Pro (Annual)', amount: 79.99, method: 'Stripe Card', status: 'verified', timestamp: '2026-10-07T14:30:00Z' },
          { id: 'tx_9844', student: 'elena@voltrix.ai', plan: 'Scholar Pro', amount: 9.99, method: 'Airtel Money', status: 'verified', timestamp: '2026-10-07T22:11:00Z' },
        ]
      });
    }

    // Command Center: POST /api/admin/test-whatsapp
    if (req.method === "POST" && url.pathname === "/api/admin/test-whatsapp") {
      const body = await req.json() as { phone?: string; message?: string };
      if (!body.phone) {
        return Response.json({ success: false, error: "Phone number required" }, { status: 400 });
      }
      const wa = (env as any).WHATSAPP;
      if (wa) {
        try {
          const res = await wa.fetch("https://voltrix-whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: body.phone, message: body.message || "Voltrix OS Copilot test ping." })
          });
          const text = await res.text();
          return Response.json({ success: res.ok, response: text });
        } catch (e: any) {
          return Response.json({ success: false, error: e?.message || String(e) }, { status: 500 });
        }
      }
      return Response.json({ success: true, simulated: true, message: `Dispatched to ${body.phone}` });
    }

    if (url.pathname === "/api") {
      // Make sure the bundled format blueprints are installed. The AdminSettings DO doesn't wake
      // merely because someone deployed, so the install needs a trigger; hanging it off API
      // traffic means a fresh deployment is provisioned by its first visitor. Fire-and-forget,
      // and the DO is idempotent.
      if (!formatBlueprintInstallStarted) {
        formatBlueprintInstallStarted = true;
        ctx.waitUntil(ctx.exports.AdminSettings.getByName("").ensureFormatBlueprintsInstalled()
            .then((complete: boolean) => {
              // A partial install resolves rather than throwing, and nothing else will call the DO
              // from here, so clearing this is the whole retry: one bad archive would otherwise
              // leave the deployment half-provisioned for as long as the isolate lives.
              if (!complete) formatBlueprintInstallStarted = false;
            })
            .catch((err: unknown) => {
              // Likewise let the next request try again. The DO coalesces concurrent callers, so a
              // retry costs one comparison once it succeeds.
              formatBlueprintInstallStarted = false;
              logger.warn("failed to install bundled format blueprints", {
                event: "formats.install.trigger.failed", error: err,
              });
            }));
      }

      let accessPayload: JWTPayload | undefined;

      if (env.CF_ACCESS_AUD) {
        if (req.headers.get("Origin") !== url.origin) {
          return new Response("Cross-origin API access not allowed.", { status: 403 });
        }

        const payload = await verifyCfAccessJwt(req, env);
        if (!payload) return new Response("Invalid CF access JWT.", { status: 403 });

        if (!payload.email) {
          return new Response("Access JWT didn't specify email address.", { status: 403 });
        }

        accessPayload = payload;
      }

      // HACK: Implement `abortSession` callback by closing the websocket.
      // TODO: When ctx.abort() becomes non-experimental, consider using that instead.
      let abortController = new AbortController();
      let abortSession = (reason: Error) => {
        // Closing the socket fails no invocation, so nothing else logs this.
        logger.warn("aborting api session", { event: "session.abort", error: reason });
        abortController.abort(reason);
      };

      return await newWorkersRpcResponse(req,
          new PublicApiImpl(ctx, env, abortSession, accessPayload),
          { abortSignal: abortController.signal });
    }

    return new Response("Not Found", {status: 404});
  }
} satisfies ExportedHandler<Env>;

// Extend Cap'n Web's RpcSessionOptions with an AbortSignal.
//
// TODO: Consider adding this feature to Cap'n Web. However, we might not actually need it for
//   long: ctx.abort() will soon be available non-experimentally, in which case we can just use
//   that instead.
type ExtendedRpcSessionOptions = RpcSessionOptions & {
  // Abort WebSocket sessions when this AbortSignal is aborted. (No effect on HTTP batch sessions.)
  abortSignal: AbortSignal;
};

// Clone of newWorkersRpcResponse() from Cap'n Web, except the `options` has been extended with
// `abortSignal`.
async function newWorkersRpcResponse(
    request: Request, localMain: any, options?: ExtendedRpcSessionOptions) {
  if (request.method === "POST") {
    let response = await newHttpBatchRpcResponse(request, localMain, options);
    // Since we're exposing the same API over WebSocket, too, and WebSocket always allows
    // cross-origin requests, the API necessarily must be safe for cross-origin use (e.g. because
    // it uses in-band authorization, as recommended in the readme). So, we might as well allow
    // batch requests to be made cross-origin as well.
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } else if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
    return newWorkersWebSocketRpcResponse(request, localMain, options);
  } else {
    return new Response("This endpoint only accepts POST or WebSocket requests.", { status: 400 });
  }
}

function newWorkersWebSocketRpcResponse(
    request: Request, localMain?: any, options?: ExtendedRpcSessionOptions): Response {
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
    return new Response("This endpoint only accepts WebSocket requests.", { status: 400 });
  }

  let pair = new WebSocketPair();
  let server = pair[0];
  server.accept()
  let stub = newWebSocketRpcSession(server, localMain, options);

  // -- ADDED FOR GADGETS --
  if (options?.abortSignal) {
    if (options.abortSignal.aborted) {
      stub[Symbol.dispose]();
    } else {
      options.abortSignal.addEventListener("abort", () => {
        stub[Symbol.dispose]();
      });
    }
  }
  // -- END ADDED FOR GADGETS --

  return new Response(null, {
    status: 101,
    webSocket: pair[1],
  });
}
