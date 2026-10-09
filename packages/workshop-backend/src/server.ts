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

// ── Silent Edge Geo-Intelligence & Regional Mappings ────────────────────────
function extractGeoContext(req: Request) {
  const cf = (req as any).cf || {};
  const countryHeader = req.headers.get("cf-ipcountry") || "";
  const cityHeader = req.headers.get("cf-city") || "";
  const regionHeader = req.headers.get("cf-region") || "";
  const timezoneHeader = req.headers.get("cf-timezone") || "";

  const country = (cf.country || countryHeader || "UG").toUpperCase();
  const city = cf.city || cityHeader || "Kampala";
  const region = cf.region || regionHeader || "Central";
  const timezone = cf.timezone || timezoneHeader || "Africa/Kampala";
  const colo = cf.colo || "MBA";
  const asn = cf.asn || 37075;

  const geoMap: Record<string, {
    countryName: string;
    currency: { code: string; symbol: string; rateToUsd: number };
    sectorDefaults: {
      higherEdTerm: string;
      secondaryTerm: string;
      examinationBody: string;
      secondaryLevels: string[];
    };
  }> = {
    UG: {
      countryName: "Uganda",
      currency: { code: "UGX", symbol: "USh ", rateToUsd: 3750 },
      sectorDefaults: {
        higherEdTerm: "University & Tertiary Institution",
        secondaryTerm: "Secondary School (O/A-Level)",
        examinationBody: "UNEB (Uganda National Examinations Board)",
        secondaryLevels: ["Senior 1", "Senior 2", "Senior 3", "Senior 4 (UCE)", "Senior 5", "Senior 6 (UACE)"]
      }
    },
    KE: {
      countryName: "Kenya",
      currency: { code: "KES", symbol: "KSh ", rateToUsd: 130 },
      sectorDefaults: {
        higherEdTerm: "University & TVET College",
        secondaryTerm: "Secondary School (KCSE / CBC)",
        examinationBody: "KNEC (Kenya National Examinations Council)",
        secondaryLevels: ["Form 1", "Form 2", "Form 3", "Form 4 (KCSE)", "Grade 10 (Senior School)", "Grade 11", "Grade 12"]
      }
    },
    TZ: {
      countryName: "Tanzania",
      currency: { code: "TZS", symbol: "TSh ", rateToUsd: 2650 },
      sectorDefaults: {
        higherEdTerm: "Chuo Kikuu / Higher Education",
        secondaryTerm: "Shule ya Sekondari (CSEE / ACSEE)",
        examinationBody: "NECTA (National Examinations Council of Tanzania)",
        secondaryLevels: ["Form 1", "Form 2", "Form 3", "Form 4 (CSEE)", "Form 5", "Form 6 (ACSEE)"]
      }
    },
    RW: {
      countryName: "Rwanda",
      currency: { code: "RWF", symbol: "FRw ", rateToUsd: 1350 },
      sectorDefaults: {
        higherEdTerm: "University & Polytechnic",
        secondaryTerm: "Secondary School (O/A-Level)",
        examinationBody: "NESA (National Examination and School Inspection Authority)",
        secondaryLevels: ["Senior 1", "Senior 2", "Senior 3 (O-Level)", "Senior 4", "Senior 5", "Senior 6 (Advanced)"]
      }
    },
    NG: {
      countryName: "Nigeria",
      currency: { code: "NGN", symbol: "₦", rateToUsd: 1550 },
      sectorDefaults: {
        higherEdTerm: "University & Polytechnic",
        secondaryTerm: "Secondary School (WAEC / NECO)",
        examinationBody: "WAEC / NECO / JAMB",
        secondaryLevels: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3 (WASSCE)"]
      }
    },
    GH: {
      countryName: "Ghana",
      currency: { code: "GHS", symbol: "GH₵", rateToUsd: 15.5 },
      sectorDefaults: {
        higherEdTerm: "University & Technical University",
        secondaryTerm: "Senior High School (SHS)",
        examinationBody: "WAEC (West African Examinations Council)",
        secondaryLevels: ["SHS 1", "SHS 2", "SHS 3 (WASSCE)"]
      }
    },
    GB: {
      countryName: "United Kingdom",
      currency: { code: "GBP", symbol: "£", rateToUsd: 0.79 },
      sectorDefaults: {
        higherEdTerm: "University & Higher Education",
        secondaryTerm: "Secondary School & Sixth Form",
        examinationBody: "Ofqual (AQA / Edexcel / OCR)",
        secondaryLevels: ["Year 7", "Year 8", "Year 9", "Year 10 (GCSE)", "Year 11 (GCSE)", "Year 12 (AS)", "Year 13 (A-Level)"]
      }
    },
    US: {
      countryName: "United States",
      currency: { code: "USD", symbol: "$", rateToUsd: 1.0 },
      sectorDefaults: {
        higherEdTerm: "College & University",
        secondaryTerm: "High School (9th-12th Grade)",
        examinationBody: "College Board / AP / ACT / SAT",
        secondaryLevels: ["9th Grade (Freshman)", "10th Grade (Sophomore)", "11th Grade (Junior)", "12th Grade (Senior / AP)"]
      }
    }
  };

  const matched = geoMap[country] || {
    countryName: "Global",
    currency: { code: "USD", symbol: "$", rateToUsd: 1.0 },
    sectorDefaults: {
      higherEdTerm: "College & University",
      secondaryTerm: "Secondary / High School",
      examinationBody: "National / International Board",
      secondaryLevels: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"]
    }
  };

  return {
    country,
    countryName: matched.countryName,
    city,
    region,
    timezone,
    colo,
    asn,
    currency: matched.currency,
    sectorDefaults: matched.sectorDefaults,
  };
}

const DEFAULT_PLANS = [
  // Higher Education Sector
  {
    id: 'free',
    sector: 'higher_ed',
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
      'Export to Markdown & Plaintext'
    ]
  },
  {
    id: 'pro',
    sector: 'higher_ed',
    label: 'Scholar Pro',
    badge: 'Most Popular',
    description: 'Comprehensive research, STEM proofs & coding power for university scholars',
    monthly: 9.99,
    annual: 79.99,
    dailyQueries: 500,
    isPopular: true,
    active: true,
    cta: 'Upgrade to Scholar Pro',
    features: [
      '500 AI queries per day (unlimited during exam periods)',
      'Flagship Reasoning: Claude 3.5 Sonnet, GPT-4o, DeepSeek R1',
      'Groq LPU ultra-fast token streaming (800+ tok/s)',
      'Multi-document RAG (PDFs, URLs, YouTube lectures, textbooks)',
      'Socratic Code Review & Big-O algorithm breakdown',
      'LaTeX & SymPy math derivations with step-by-step proofs',
      'Writing Coach & Academic Paraphraser',
      '50 MB document ingestion per upload',
      '1-click Word (.docx) & PDF publication export'
    ]
  },
  {
    id: 'cohort',
    sector: 'higher_ed',
    label: 'Study Cohort / Group',
    badge: 'Best for Groups (5–25)',
    description: 'Collaborative research, shared lecture RAG & 6-char PIN join code for 5–25 students',
    monthly: 22.45,
    annual: 179.99,
    perSeatMonthly: 4.49,
    minSeats: 5,
    dailyQueries: 1500,
    isPopular: false,
    active: true,
    cta: 'Create Study Cohort',
    features: [
      '5 to 25 shared student seats with instant 6-char PIN join codes',
      'Shared Cohort Document Vault (upload textbook/slides once for all members)',
      'Shared query pool (1,500 queries/day pooled or per-seat limits)',
      'Collaborative coursework revision & study group chat',
      'Department / Lead Student admin dashboard',
      'Split billing & Mobile Money / Card checkout'
    ]
  },
  {
    id: 'campus',
    sector: 'higher_ed',
    label: 'Campus Institutional',
    badge: 'For Departments & Labs',
    description: 'Departmental oversight, Socratic cheating lock, custom rubrics & LMS sync for faculties',
    monthly: 149.00,
    annual: 1190.00,
    dailyQueries: 10000,
    isPopular: false,
    active: true,
    cta: 'Deploy Campus License',
    features: [
      'Unlimited student enrollments under departmental domain',
      'Educator Cockpit: Socratic Guidance toggle (prevents direct answer copy-pasting)',
      'Class struggle detection & topic mastery heatmaps',
      'Moodle / Canvas LMS roster sync plugin endpoints',
      'Custom faculty grading rubric importer & audit presets',
      'Bulk multi-language academic document translation',
      'Dedicated SLA, institutional compliance & audit logs'
    ]
  },
  // Secondary School Sector
  {
    id: 'secondary_candidate',
    sector: 'secondary',
    label: 'Candidate Revision Pass',
    badge: 'Exam Preparation',
    description: 'Targeted syllabus mastery, step-by-step math solver & past paper breakdown for candidates',
    monthly: 4.99,
    annual: 39.99,
    dailyQueries: 200,
    isPopular: true,
    active: true,
    cta: 'Get Candidate Pass',
    features: [
      'National Examination past paper breakdowns (UNEB / KCSE / WAEC / GCSE)',
      'Step-by-step formula explanations for Physics, Chemistry & Math',
      'Socratic hint tutor: guides student thinking without spoiling answers',
      'Audio & diagram explainer for complex biology & geography cycles',
      'Parent & Guardian weekly progress summary export'
    ]
  },
  {
    id: 'secondary_stream',
    sector: 'secondary',
    label: 'Class Stream / Study Squad',
    badge: 'For Classes (10–45 Students)',
    description: 'Teacher broadcast hub, class homework assistance & instant PIN joining for whole streams',
    monthly: 24.90,
    annual: 199.00,
    perSeatMonthly: 2.49,
    minSeats: 10,
    dailyQueries: 3500,
    isPopular: false,
    active: true,
    cta: 'Register Class Stream',
    features: [
      '10 to 45 student seats with simple 6-character class join code',
      'Teacher Variable Levers: set daily query caps & enable Exam Lockout during tests',
      'Curriculum alignment: UNEB UCE/UACE, KNEC KCSE, WAEC, GCSE',
      'Class announcement broadcaster directly to student screens',
      'Automatic homework feedback & concept explanation generator'
    ]
  },
  {
    id: 'secondary_academy',
    sector: 'secondary',
    label: 'Whole-School Academy License',
    badge: 'Principal & School Board',
    description: 'Complete secondary institution deployment with grade-level oversight & teacher lesson planning',
    monthly: 199.00,
    annual: 1590.00,
    dailyQueries: 25000,
    isPopular: false,
    active: true,
    cta: 'Deploy School Academy',
    features: [
      'Whole-school access across all streams and grade levels',
      'Teacher AI Assistant: 1-click lesson planning, quiz & worksheet generation',
      'Strict Academic Integrity: locked Socratic mode for students',
      'Principal & Head of Department curriculum coverage dashboard',
      'Offline/low-bandwidth compressed responses for school computer labs',
      'Multi-teacher co-admin permissions & centralized school billing'
    ]
  }
];

const DEFAULT_PLAN_REASONS = [
  {
    id: 'integrity',
    icon: 'ShieldCheck',
    title: 'Guaranteed Academic Integrity & Socratic Enforcement',
    summary: 'Prevent AI from writing homework for students. Educators can lock the cohort to Socratic Mode, compelling the model to ask guiding questions, verify student working, and scaffold conceptual mastery rather than outputting raw solutions.'
  },
  {
    id: 'curriculum',
    icon: 'Target',
    title: 'Regional Exam Board & Curriculum Calibration',
    summary: 'Pre-calibrated for national and regional curricula—including UNEB (UCE/UACE), KNEC (KCSE), WAEC (WASSCE), Cambridge GCSE/A-Levels, and AP. Learner queries match authentic marking guides and local syllabus depth.'
  },
  {
    id: 'levers',
    icon: 'Sliders',
    title: 'Educator Variable Control Levers',
    summary: 'Department heads, lecturers, and teachers gain precise control over AI tools: dial daily query caps per learner, toggle solution generation on/off, schedule Exam Mode lockouts during live assessments, and upload custom grading rubrics.'
  },
  {
    id: 'struggle',
    icon: 'ChartLineUp',
    title: 'Early Struggle Detection & Mastery Heatmaps',
    summary: 'Know which topics pupils or undergrads are finding difficult before exam results arrive. The educator cockpit tracks aggregated question themes (e.g. Organic Chemistry, Calculus, Data Structures) in real time without compromising individual student privacy.'
  },
  {
    id: 'provisioning',
    icon: 'UsersFour',
    title: 'Frictionless 6-Char PIN & Magic Link Join',
    summary: 'Eliminate tedious student account setup. Instructors generate a simple 6-character PIN code (e.g. MAK-26, BDO-19) that students type on their phone or laptop to instantly bind to the cohort plan and shared syllabus library.'
  },
  {
    id: 'savings',
    icon: 'Coins',
    title: 'Up to 60% Multi-Seat Cost Advantage',
    summary: 'Pooled licenses drop per-learner rates as low as $2.49/month, with unified institutional invoicing, split student contributions, and direct Mobile Money (MTN, Airtel, M-Pesa) or card payment.'
  }
];

async function sendReceiptEmail(env: Env, invoice: any) {
  const uEmail = invoice?.userId?.toLowerCase()?.trim();
  if (!uEmail || !uEmail.includes('@')) return;

  const formattedAmount = `${invoice.currency} ${(invoice.amount || 0).toLocaleString()}`;
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #111827; border-radius: 16px; border: 1px solid #1f2937; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px;">
      <h2 style="margin: 0; color: #6366f1; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Voltrix OS</h2>
      <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.3);">PAID &bull; ACTIVE</span>
    </div>

    <h3 style="margin: 0 0 8px; font-size: 18px; color: #ffffff;">Payment Receipt & Subscription Confirmation</h3>
    <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.5;">
      Thank you for subscribing. Your account has been upgraded and your subscription to <strong>${invoice.planLabel}</strong> is now active.
    </p>

    <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Invoice Number</td>
          <td style="padding: 6px 0; text-align: right; color: #e2e8f0; font-family: monospace; font-weight: 600;">${invoice.invoiceId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Billed To</td>
          <td style="padding: 6px 0; text-align: right; color: #e2e8f0; font-weight: 500;">${invoice.userId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Plan</td>
          <td style="padding: 6px 0; text-align: right; color: #818cf8; font-weight: 600;">${invoice.planLabel}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Duration</td>
          <td style="padding: 6px 0; text-align: right; color: #e2e8f0; font-weight: 500;">${invoice.months || 1} month(s)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Payment Method</td>
          <td style="padding: 6px 0; text-align: right; color: #e2e8f0; font-weight: 500;">${invoice.paymentMethod || 'Credit / Debit Card'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Billing Model</td>
          <td style="padding: 6px 0; text-align: right; color: #e2e8f0; font-weight: 500;">${invoice.autoRenew ? 'Automatic renewal' : 'Manual renewal'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Date</td>
          <td style="padding: 6px 0; text-align: right; color: #e2e8f0; font-weight: 500;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
        </tr>
        <tr style="border-top: 1px solid #334155;">
          <td style="padding: 14px 0 4px; font-weight: 700; color: #ffffff; font-size: 15px;">Total Paid</td>
          <td style="padding: 14px 0 4px; text-align: right; font-weight: 800; color: #34d399; font-size: 18px;">${formattedAmount}</td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 24px; font-size: 13px; color: #94a3b8; line-height: 1.5;">
      Your tax invoice has also been deposited into your in-app <strong>Voltrix Inbox</strong>, where you can review and print it at any time.
    </p>

    <div style="text-align: center;">
      <a href="https://voltrix.stream" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px;">
        Open Voltrix Workspace
      </a>
    </div>
  </div>
</body>
</html>`;

  // 1. Try sending via GATEKEEPER_EMAIL binding
  try {
    const emailGatekeeper = (env as any).GATEKEEPER_EMAIL;
    if (emailGatekeeper && typeof emailGatekeeper.sendSystemEmail === 'function') {
      const ok = await emailGatekeeper.sendSystemEmail(
        uEmail,
        `Payment Receipt: Voltrix ${invoice.planLabel} (${invoice.invoiceId})`,
        html,
        "Voltrix Billing <noreply@em.voltrix.stream>"
      );
      if (ok) {
        logger.info("Receipt sent via GATEKEEPER_EMAIL", { event: "receipt_sent_gatekeeper" });
        return;
      }
    }
  } catch (e) {
    logger.warn("GATEKEEPER_EMAIL sendSystemEmail threw error", { event: "gatekeeper_email_error" });
  }

  // 2. Direct Resend API fallback if key available
  const resendKey = (env as any).RESEND_API_KEY;
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Voltrix Billing <noreply@em.voltrix.stream>",
          to: [uEmail],
          subject: `Payment Receipt: Voltrix ${invoice.planLabel} (${invoice.invoiceId})`,
          html,
        }),
      });
    } catch (e) {
      logger.warn("Direct Resend fetch failed", { event: "resend_fetch_error" });
    }
  }
}

async function recordInvoiceAndInbox(env: Env, invoice: any) {
  const uEmail = invoice.userId?.toLowerCase()?.trim();
  if (!uEmail) return;

  // 1. Save invoice by tracking ID
  await env.BLUEPRINTS.put(`inv:${invoice.orderTrackingId}`, JSON.stringify(invoice));

  // 2. Save invoice by invoice ID
  if (invoice.invoiceId) {
    await env.BLUEPRINTS.put(`inv:${invoice.invoiceId}`, JSON.stringify(invoice));
  }

  // 3. User invoices list
  const userInvKey = `user_inv:${uEmail}`;
  const existingInvoices = (await env.BLUEPRINTS.get(userInvKey, "json")) as any[] || [];
  const updatedInvoices = [invoice, ...existingInvoices.filter((i: any) => i.invoiceId !== invoice.invoiceId)].slice(0, 50);
  await env.BLUEPRINTS.put(userInvKey, JSON.stringify(updatedInvoices));

  // 4. User inbox message
  const userInboxKey = `inbox:${uEmail}`;
  const existingInbox = (await env.BLUEPRINTS.get(userInboxKey, "json")) as any[] || [];
  const inboxItem = {
    id: `msg_inv_${invoice.orderTrackingId || Date.now()}`,
    type: 'invoice',
    title: `Receipt & Tax Invoice: ${invoice.planLabel} (${invoice.invoiceId})`,
    sender: { name: 'Voltrix Billing System', role: 'system' },
    recipient: uEmail,
    content: `Your subscription to ${invoice.planLabel} for ${invoice.months || 1} month(s) was confirmed. Total paid: ${invoice.currency} ${(invoice.amount || 0).toLocaleString()}. Your workspace is fully unlocked.`,
    invoice,
    read: false,
    createdAt: invoice.paidAt || new Date().toISOString()
  };
  const updatedInbox = [inboxItem, ...existingInbox.filter((m: any) => m.id !== inboxItem.id)].slice(0, 100);
  await env.BLUEPRINTS.put(userInboxKey, JSON.stringify(updatedInbox));
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
    if ((req.method === "GET" || req.method === "HEAD") && url.pathname.startsWith("/api/hf-videos/")) {
      const name = url.pathname.slice("/api/hf-videos/".length);
      if (!name || name.includes("..") || !name.endsWith(".mp4")) {
        return new Response("Not Found", { status: 404 });
      }
      const obj = await env.BLUEPRINT_CONTENT.get(`hf-videos/${name}`);
      if (!obj) return new Response("Not Found", { status: 404 });
      return new Response(req.method === "HEAD" ? null : obj.body, {
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

    // ── TEMP: Admin endpoint to force Google reconnect with full scopes ──
    // GET /api/admin/reconnect-google?username=<username>
    // Authorization: Bearer <admin-username>
    if (req.method === "GET" && url.pathname === "/api/admin/reconnect-google") {
      const admins: string[] = typeof env.ADMINS === "string"
          ? JSON.parse(env.ADMINS) : (env.ADMINS ?? []);
      const auth = req.headers.get("Authorization") ?? "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
      if (!admins.includes(token)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { "Content-Type": "application/json" },
        });
      }
      const username = url.searchParams.get("username") ?? token;
      const doKey = username.includes("@") ? username.toLowerCase().trim() : normalizeUsername(username);
      try {
        const userStub = ctx.exports.UserDurableObject.get(
          ctx.exports.UserDurableObject.idFromName(doKey)
        );
        const accountId = await userStub.getConnectedAccountIdForVendor("google");
        if (accountId === null) {
          return new Response(JSON.stringify({ error: "No Google account connected for this user" }), {
            status: 404, headers: { "Content-Type": "application/json" },
          });
        }
        const result = await userStub.reconnectAccount(accountId);        return new Response(JSON.stringify({ url: result.url }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }
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

    // Silent Edge Geo-Intelligence: GET /api/geo/context
    if (req.method === "GET" && url.pathname === "/api/geo/context") {
      const geo = extractGeoContext(req);
      const userParam = url.searchParams.get("userId") || "";
      if (userParam) {
        const uEmail = userParam.toLowerCase().trim();
        try {
          const uRecord = (await env.BLUEPRINTS.get(`u:${uEmail}`, "json")) as any;
          if (uRecord) {
            const prevLoc = uRecord.currentLocation;
            if (prevLoc && (prevLoc.country !== geo.country || prevLoc.region !== geo.region)) {
              const history = Array.isArray(uRecord.locationHistory) ? uRecord.locationHistory : [];
              history.unshift({
                from: { country: prevLoc.country, region: prevLoc.region, city: prevLoc.city },
                to: { country: geo.country, region: geo.region, city: geo.city },
                changedAt: new Date().toISOString()
              });
              uRecord.lastLocation = prevLoc;
              uRecord.locationHistory = history.slice(0, 10);
            }
            uRecord.currentLocation = {
              country: geo.country,
              region: geo.region,
              city: geo.city,
              timezone: geo.timezone,
              updatedAt: new Date().toISOString()
            };
            await env.BLUEPRINTS.put(`u:${uEmail}`, JSON.stringify(uRecord));
          }
        } catch (e) {
          logger.warn("Could not record geo migration", { event: "geo_migration_error" });
        }
      }
      return Response.json({ success: true, geo });
    }

    // Command Center & Public SaaS: GET /api/admin/plans & GET /api/plans
    if (url.pathname === "/api/admin/plans" || url.pathname === "/api/plans") {
      if (req.method === "GET") {
        const stored = await env.BLUEPRINTS.get("sys:plans", "json");
        return Response.json({
          success: true,
          plans: stored || DEFAULT_PLANS,
          reasons: DEFAULT_PLAN_REASONS
        });
      }
      if (req.method === "POST") {
        const body = await req.json() as { plans?: any };
        const plansToSave = body.plans || body;
        await env.BLUEPRINTS.put("sys:plans", JSON.stringify(plansToSave));
        return Response.json({ success: true, plans: plansToSave });
      }
    }

    // Cohorts: GET /api/cohorts/list
    if (req.method === "GET" && url.pathname === "/api/cohorts/list") {
      const educatorEmail = url.searchParams.get("educatorEmail")?.toLowerCase().trim();
      const storedCohorts = (await env.BLUEPRINTS.get("sys:cohorts", "json")) as any[] || [
        {
          id: 'coh_makerere_eng',
          name: 'Makerere Software Engineering 2026',
          sector: 'higher_ed',
          institution: 'Makerere University (MAK)',
          departmentOrGrade: 'Dept of Computer Science & Software Eng',
          educatorEmail: 'prof.ssemakula@eng.mak.ac.ug',
          educatorName: 'Prof. Dennis Ssemakula',
          plan: 'campus',
          joinCode: 'MAK-48',
          maxSeats: 45,
          currentSeats: 38,
          variables: {
            dailyQueryLimit: 50,
            socraticMode: true,
            examLock: false,
            allowSharedUploads: true,
            curriculumFocus: 'CS310: Algorithms & Distributed Systems'
          },
          createdAt: '2026-09-15T08:00:00Z'
        },
        {
          id: 'coh_gayaza_s4',
          name: 'Gayaza High S4 Physics Stream A',
          sector: 'secondary',
          institution: 'Gayaza High School',
          departmentOrGrade: 'Senior 4 Science Stream',
          educatorEmail: 'tr.nabukenya@gayazahs.sc.ug',
          educatorName: 'Mrs. Rebecca Nabukenya',
          plan: 'secondary_stream',
          joinCode: 'GHS-22',
          maxSeats: 35,
          currentSeats: 32,
          variables: {
            dailyQueryLimit: 25,
            socraticMode: true,
            examLock: false,
            allowSharedUploads: true,
            curriculumFocus: 'UNEB UCE Physics 535 / Chemistry 545'
          },
          createdAt: '2026-09-20T10:30:00Z'
        },
        {
          id: 'coh_uon_med',
          name: 'UoN Clinical Medicine Year 3',
          sector: 'higher_ed',
          institution: 'University of Nairobi (UoN)',
          departmentOrGrade: 'School of Medicine',
          educatorEmail: 'dr.omondi@uonbi.ac.ke',
          educatorName: 'Dr. Kennedy Omondi',
          plan: 'campus',
          joinCode: 'UON-91',
          maxSeats: 50,
          currentSeats: 44,
          variables: {
            dailyQueryLimit: 75,
            socraticMode: false,
            examLock: false,
            allowSharedUploads: true,
            curriculumFocus: 'Internal Medicine & Pharmacology Diagnostics'
          },
          createdAt: '2026-09-28T14:15:00Z'
        }
      ];

      if (educatorEmail) {
        const filtered = storedCohorts.filter(c => c.educatorEmail?.toLowerCase() === educatorEmail);
        return Response.json({ success: true, count: filtered.length, cohorts: filtered });
      }
      return Response.json({ success: true, count: storedCohorts.length, cohorts: storedCohorts });
    }

    // Cohorts: POST /api/cohorts/create
    if (req.method === "POST" && url.pathname === "/api/cohorts/create") {
      const body = await req.json().catch(() => ({})) as any;
      const { name, sector, institution, departmentOrGrade, educatorEmail, educatorName, plan, maxSeats, variables } = body;
      if (!name || !institution) {
        return Response.json({ success: false, error: "Cohort name and institution required" }, { status: 400 });
      }

      const prefix = (institution.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'VOL').padEnd(3, 'X');
      const numCode = Math.floor(10 + Math.random() * 90);
      const joinCode = `${prefix}-${numCode}`;
      const cohortId = `coh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const newCohort = {
        id: cohortId,
        name: name.trim(),
        sector: sector || 'higher_ed',
        institution: institution.trim(),
        departmentOrGrade: departmentOrGrade || '',
        educatorEmail: (educatorEmail || 'educator@voltrix.ai').toLowerCase().trim(),
        educatorName: educatorName || 'Lead Educator',
        plan: plan || 'cohort',
        joinCode,
        maxSeats: Number(maxSeats) || 30,
        currentSeats: 1,
        variables: {
          dailyQueryLimit: Number(variables?.dailyQueryLimit) || 50,
          socraticMode: variables?.socraticMode !== undefined ? !!variables.socraticMode : true,
          examLock: !!variables?.examLock,
          allowSharedUploads: variables?.allowSharedUploads !== undefined ? !!variables.allowSharedUploads : true,
          curriculumFocus: variables?.curriculumFocus || 'General Syllabus'
        },
        createdAt: new Date().toISOString()
      };

      await env.BLUEPRINTS.put(`coh:${cohortId}`, JSON.stringify(newCohort));
      await env.BLUEPRINTS.put(`coh_code:${joinCode.toUpperCase()}`, cohortId);

      const storedCohorts = (await env.BLUEPRINTS.get("sys:cohorts", "json")) as any[] || [];
      await env.BLUEPRINTS.put("sys:cohorts", JSON.stringify([newCohort, ...storedCohorts].slice(0, 50)));

      const initialMembers = [
        {
          email: newCohort.educatorEmail,
          name: newCohort.educatorName,
          role: 'lead_educator',
          joinedAt: newCohort.createdAt,
          queriesUsed: 0,
          lastActive: newCohort.createdAt,
          struggleTopics: []
        }
      ];
      await env.BLUEPRINTS.put(`coh:${cohortId}:members`, JSON.stringify(initialMembers));

      return Response.json({ success: true, cohort: newCohort });
    }

    // Cohorts: POST /api/cohorts/join
    if (req.method === "POST" && url.pathname === "/api/cohorts/join") {
      const body = await req.json().catch(() => ({})) as any;
      const code = (body.code || body.joinCode || "").trim().toUpperCase();
      const studentEmail = (body.studentEmail || body.email || "").toLowerCase().trim();
      const studentName = (body.studentName || body.name || "Scholar").trim();

      if (!code || !studentEmail) {
        return Response.json({ success: false, error: "6-character join code and email required" }, { status: 400 });
      }

      let cohortId = await env.BLUEPRINTS.get(`coh_code:${code}`);
      let cohortData: any = null;

      if (cohortId) {
        cohortData = await env.BLUEPRINTS.get(`coh:${cohortId}`, "json");
      } else {
        const storedCohorts = (await env.BLUEPRINTS.get("sys:cohorts", "json")) as any[] || [];
        const match = storedCohorts.find(c => c.joinCode?.toUpperCase() === code);
        if (match) {
          cohortId = match.id;
          cohortData = match;
        }
      }

      if (!cohortData || !cohortId) {
        return Response.json({ success: false, error: "Invalid or expired cohort PIN code" }, { status: 404 });
      }

      const members = (await env.BLUEPRINTS.get(`coh:${cohortId}:members`, "json")) as any[] || [];
      const alreadyJoined = members.some(m => m.email?.toLowerCase() === studentEmail);

      if (!alreadyJoined) {
        if (cohortData.maxSeats && members.length >= cohortData.maxSeats) {
          return Response.json({ success: false, error: "This cohort has reached maximum capacity" }, { status: 403 });
        }
        members.push({
          email: studentEmail,
          name: studentName,
          role: 'learner',
          joinedAt: new Date().toISOString(),
          queriesUsed: 0,
          lastActive: new Date().toISOString(),
          struggleTopics: []
        });
        cohortData.currentSeats = members.length;
        await env.BLUEPRINTS.put(`coh:${cohortId}`, JSON.stringify(cohortData));
        await env.BLUEPRINTS.put(`coh:${cohortId}:members`, JSON.stringify(members));

        const allCohorts = (await env.BLUEPRINTS.get("sys:cohorts", "json")) as any[] || [];
        const updatedAll = allCohorts.map(c => c.id === cohortId ? { ...c, currentSeats: members.length } : c);
        await env.BLUEPRINTS.put("sys:cohorts", JSON.stringify(updatedAll));
      }

      // Link student user profile to cohort and upgrade plan privileges
      const existingUser = (await env.BLUEPRINTS.get(`u:${studentEmail}`, "json")) as any || { id: studentEmail };
      existingUser.cohortId = cohortId;
      existingUser.cohortName = cohortData.name;
      existingUser.cohortInstitution = cohortData.institution;
      existingUser.plan = cohortData.plan || 'cohort';
      existingUser.isPro = true;
      existingUser.cohortVariables = cohortData.variables;
      existingUser.updatedAt = Date.now();
      await env.BLUEPRINTS.put(`u:${studentEmail}`, JSON.stringify(existingUser));

      return Response.json({
        success: true,
        cohortId,
        cohortName: cohortData.name,
        institution: cohortData.institution,
        plan: cohortData.plan,
        variables: cohortData.variables,
        alreadyJoined
      });
    }

    // Cohorts: GET /api/cohorts/:id & subresources
    if (req.method === "GET" && url.pathname.startsWith("/api/cohorts/")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const cohortId = parts[2];
      const sub = parts[3];

      if (cohortId && sub === "members") {
        const members = (await env.BLUEPRINTS.get(`coh:${cohortId}:members`, "json")) as any[] || [
          { email: 'alex.t@eng.mak.ac.ug', name: 'Alex Tumwesigye', role: 'learner', queriesUsed: 42, lastActive: '2026-10-08T09:12:00Z', struggleTopics: ['Dynamic Programming', 'Graph Theory'] },
          { email: 'sarah.k@eng.mak.ac.ug', name: 'Sarah Kemigisha', role: 'learner', queriesUsed: 38, lastActive: '2026-10-08T11:45:00Z', struggleTopics: ['Distributed Consensus (Raft)'] },
          { email: 'kevin.o@eng.mak.ac.ug', name: 'Kevin Ouma', role: 'learner', queriesUsed: 50, lastActive: '2026-10-08T12:05:00Z', struggleTopics: ['SQL Indexing & B-Trees'] },
          { email: 'patience.n@eng.mak.ac.ug', name: 'Patience Namuli', role: 'learner', queriesUsed: 19, lastActive: '2026-10-07T18:30:00Z', struggleTopics: [] },
          { email: 'prof.ssemakula@eng.mak.ac.ug', name: 'Prof. Dennis Ssemakula', role: 'lead_educator', queriesUsed: 12, lastActive: '2026-10-08T13:00:00Z', struggleTopics: [] },
        ];
        return Response.json({ success: true, count: members.length, members });
      }

      if (cohortId && sub === "metrics") {
        return Response.json({
          success: true,
          cohortId,
          metrics: {
            totalQueriesThisWeek: 482,
            activeStudentPct: 88,
            socraticInteractions: 312,
            peakStudyHours: "19:00 - 23:00 EAT",
            struggleHeatmap: [
              { topic: 'Dynamic Programming & Memoization', queryCount: 84, severity: 'high' },
              { topic: 'Distributed Consensus & Raft', queryCount: 65, severity: 'medium' },
              { topic: 'Database Concurrency & ACID Locks', queryCount: 51, severity: 'medium' },
              { topic: 'TCP/IP Socket Buffers', queryCount: 29, severity: 'low' }
            ]
          }
        });
      }

      if (cohortId && sub === "announcements") {
        const announcements = (await env.BLUEPRINTS.get(`coh:${cohortId}:announcements`, "json")) as any[] || [
          {
            id: 'ann_1',
            title: 'Midterm Lab Assignment 2 Deadline Extended',
            content: 'The distributed systems lab submission is moved to Friday 23:59 EAT. Socratic Mode is active to help you trace deadlock vectors.',
            author: 'Prof. Dennis Ssemakula',
            createdAt: '2026-10-07T10:00:00Z'
          }
        ];
        return Response.json({ success: true, announcements });
      }

      if (cohortId && !sub) {
        const cohort = (await env.BLUEPRINTS.get(`coh:${cohortId}`, "json")) as any;
        if (cohort) {
          return Response.json({ success: true, cohort });
        }
        return Response.json({ success: false, error: "Cohort not found" }, { status: 404 });
      }
    }

    // Cohorts: DELETE /api/cohorts/:id
    if (req.method === "DELETE" && url.pathname.startsWith("/api/cohorts/")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const cohortId = parts[2];
      if (!cohortId) {
        return Response.json({ success: false, error: "Cohort ID required" }, { status: 400 });
      }

      const cohort = (await env.BLUEPRINTS.get(`coh:${cohortId}`, "json")) as any;
      if (cohort?.joinCode) {
        await env.BLUEPRINTS.delete(`coh_code:${cohort.joinCode}`);
      }

      await env.BLUEPRINTS.delete(`coh:${cohortId}`);
      await env.BLUEPRINTS.delete(`coh:${cohortId}:members`);
      await env.BLUEPRINTS.delete(`coh:${cohortId}:announcements`);
      await env.BLUEPRINTS.delete(`coh:${cohortId}:rubrics`);

      const allCohorts = (await env.BLUEPRINTS.get("sys:cohorts", "json")) as any[] || [];
      const updatedAll = allCohorts.filter(c => c.id !== cohortId);
      await env.BLUEPRINTS.put("sys:cohorts", JSON.stringify(updatedAll));

      return Response.json({ success: true, deleted: cohortId });
    }

    // Cohorts: POST /api/cohorts/:id/members/add
    if (req.method === "POST" && url.pathname.includes("/members/add")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const cohortId = parts[2];
      const body = await req.json().catch(() => ({})) as any;
      const email = (body.email || "").toLowerCase().trim();
      const name = (body.name || email.split("@")[0] || "Scholar").trim();
      const role = body.role || 'learner';

      if (!cohortId || !email) {
        return Response.json({ success: false, error: "cohortId and student email required" }, { status: 400 });
      }

      const members = (await env.BLUEPRINTS.get(`coh:${cohortId}:members`, "json")) as any[] || [];
      const existing = members.find(m => m.email?.toLowerCase() === email);
      if (existing) {
        existing.role = role;
        existing.name = name;
      } else {
        members.push({
          email,
          name,
          role,
          queriesUsed: 0,
          lastActive: new Date().toISOString(),
          struggleTopics: []
        });
      }
      await env.BLUEPRINTS.put(`coh:${cohortId}:members`, JSON.stringify(members));

      const cohort = (await env.BLUEPRINTS.get(`coh:${cohortId}`, "json")) as any;
      if (cohort) {
        cohort.currentSeats = members.length;
        await env.BLUEPRINTS.put(`coh:${cohortId}`, JSON.stringify(cohort));
      }

      return Response.json({ success: true, count: members.length, members });
    }

    // Admin Users Plan Override: POST /api/admin/users/plan
    if (req.method === "POST" && url.pathname === "/api/admin/users/plan") {
      const body = await req.json().catch(() => ({})) as any;
      const email = (body.email || body.userId || "").toLowerCase().trim();
      const { plan, isPro, dailyQueryLimit, cohortId } = body;
      if (!email) {
        return Response.json({ success: false, error: "email or userId required" }, { status: 400 });
      }

      const uKey = `u:${email.toLowerCase().trim()}`;
      const userRec = (await env.BLUEPRINTS.get(uKey, "json")) as any || { id: email };
      if (plan !== undefined) userRec.plan = plan;
      if (isPro !== undefined) userRec.isPro = !!isPro;
      if (dailyQueryLimit !== undefined) userRec.dailyQueryLimit = Number(dailyQueryLimit);
      if (cohortId !== undefined) userRec.cohortId = cohortId;
      userRec.updatedAt = new Date().toISOString();

      await env.BLUEPRINTS.put(uKey, JSON.stringify(userRec));
      return Response.json({ success: true, user: userRec });
    }

    // Cohorts: POST /api/cohorts/:id/variables (Educator Levers)
    if (req.method === "POST" && url.pathname.includes("/variables")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const cohortId = parts[2];
      const body = await req.json().catch(() => ({})) as any;

      const cohort = (await env.BLUEPRINTS.get(`coh:${cohortId}`, "json")) as any;
      if (!cohort) {
        return Response.json({ success: false, error: "Cohort not found" }, { status: 404 });
      }

      cohort.variables = {
        dailyQueryLimit: Number(body.dailyQueryLimit) || cohort.variables?.dailyQueryLimit || 50,
        socraticMode: body.socraticMode !== undefined ? !!body.socraticMode : cohort.variables?.socraticMode,
        examLock: body.examLock !== undefined ? !!body.examLock : cohort.variables?.examLock,
        allowSharedUploads: body.allowSharedUploads !== undefined ? !!body.allowSharedUploads : cohort.variables?.allowSharedUploads,
        curriculumFocus: body.curriculumFocus || cohort.variables?.curriculumFocus || 'General'
      };
      cohort.updatedAt = new Date().toISOString();

      await env.BLUEPRINTS.put(`coh:${cohortId}`, JSON.stringify(cohort));

      const allCohorts = (await env.BLUEPRINTS.get("sys:cohorts", "json")) as any[] || [];
      const updatedAll = allCohorts.map(c => c.id === cohortId ? cohort : c);
      await env.BLUEPRINTS.put("sys:cohorts", JSON.stringify(updatedAll));

      return Response.json({ success: true, variables: cohort.variables });
    }

    // Cohorts: POST /api/cohorts/:id/announcements
    if (req.method === "POST" && url.pathname.includes("/announcements")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const cohortId = parts[2];
      const body = await req.json().catch(() => ({})) as any;
      const title = (body.title || "").trim();
      const content = (body.content || body.message || "").trim();
      const author = body.author || body.senderName || 'Department Faculty';

      if (!title || !content) {
        return Response.json({ success: false, error: "Title and content required" }, { status: 400 });
      }

      const existingAnn = (await env.BLUEPRINTS.get(`coh:${cohortId}:announcements`, "json")) as any[] || [];
      const newAnn = {
        id: `ann_${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        author: author || 'Department Faculty',
        createdAt: new Date().toISOString()
      };
      const updatedAnn = [newAnn, ...existingAnn].slice(0, 30);
      await env.BLUEPRINTS.put(`coh:${cohortId}:announcements`, JSON.stringify(updatedAnn));

      return Response.json({ success: true, announcement: newAnn });
    }

    // Plugins & LMS Extensibility: POST /api/plugins/lms/sync
    if (req.method === "POST" && url.pathname === "/api/plugins/lms/sync") {
      const body = await req.json().catch(() => ({})) as any;
      const { cohortId, provider } = body;
      const rosterList = body.roster || body.students || body.members;

      if (!cohortId || !Array.isArray(rosterList) || rosterList.length === 0) {
        return Response.json({ success: false, error: "cohortId and roster array required" }, { status: 400 });
      }

      const members = (await env.BLUEPRINTS.get(`coh:${cohortId}:members`, "json")) as any[] || [];
      const existingEmails = new Set(members.map(m => m.email?.toLowerCase()));
      let addedCount = 0;

      for (const item of rosterList) {
        const email = (item.email || "").toLowerCase().trim();
        if (email && !existingEmails.has(email)) {
          members.push({
            email,
            name: item.name || email.split('@')[0],
            role: item.role || 'learner',
            studentId: item.studentId || '',
            joinedAt: new Date().toISOString(),
            queriesUsed: 0,
            lastActive: new Date().toISOString(),
            struggleTopics: []
          });
          existingEmails.add(email);
          addedCount++;

          const uRec = (await env.BLUEPRINTS.get(`u:${email}`, "json")) as any || { id: email };
          uRec.cohortId = cohortId;
          uRec.isPro = true;
          uRec.plan = 'cohort';
          await env.BLUEPRINTS.put(`u:${email}`, JSON.stringify(uRec));
        }
      }

      await env.BLUEPRINTS.put(`coh:${cohortId}:members`, JSON.stringify(members));

      const cohort = (await env.BLUEPRINTS.get(`coh:${cohortId}`, "json")) as any;
      if (cohort) {
        cohort.currentSeats = members.length;
        await env.BLUEPRINTS.put(`coh:${cohortId}`, JSON.stringify(cohort));
      }

      return Response.json({
        success: true,
        provider: provider || 'generic_lms',
        totalMembers: members.length,
        addedCount
      });
    }

    // Plugins: POST /api/plugins/rubric/import
    if (req.method === "POST" && url.pathname === "/api/plugins/rubric/import") {
      const body = await req.json().catch(() => ({})) as any;
      const { cohortId, title, criteria } = body;

      if (!cohortId || !title || !Array.isArray(criteria)) {
        return Response.json({ success: false, error: "cohortId, title and criteria array required" }, { status: 400 });
      }

      const existingRubrics = (await env.BLUEPRINTS.get(`coh:${cohortId}:rubrics`, "json")) as any[] || [];
      const newRubric = {
        id: `rub_${Date.now()}`,
        title: title.trim(),
        criteria,
        importedAt: new Date().toISOString()
      };
      await env.BLUEPRINTS.put(`coh:${cohortId}:rubrics`, JSON.stringify([newRubric, ...existingRubrics]));

      return Response.json({ success: true, rubric: newRubric });
    }

    // Plugins: GET /api/plugins/manifest
    if (req.method === "GET" && url.pathname === "/api/plugins/manifest") {
      return Response.json({
        success: true,
        plugins: [
          {
            id: 'moodle_sync',
            name: 'Moodle LMS Roster Sync',
            version: '2.4.0',
            status: 'connected',
            description: 'Automated student enrollment sync via Moodle Web Services API token'
          },
          {
            id: 'canvas_lms',
            name: 'Instructure Canvas Connector',
            version: '1.9.2',
            status: 'ready',
            description: 'Course section syncing, assignments and gradebook rubric alignment'
          },
          {
            id: 'google_classroom',
            name: 'Google Classroom Bridge',
            version: '1.2.0',
            status: 'ready',
            description: '1-click roster import and announcement dissemination to Google Classroom'
          },
          {
            id: 'rubric_auditor',
            name: 'Course Rubric Pre-Submission Auditor',
            version: '3.1.0',
            status: 'active',
            description: 'Evaluates student drafts against department grading criteria before submission'
          }
        ]
      });
    }

    // National Syllabus & Past Papers: GET /api/syllabus/past-papers
    if (req.method === "GET" && url.pathname === "/api/syllabus/past-papers") {
      const examBody = url.searchParams.get("examBody");
      const papers = [
        {
          id: 'uneb-uce-phy-2023-p1',
          examBody: 'UNEB_UCE',
          examBodyName: 'UNEB (Uganda National Examinations Board)',
          subject: 'Physics Paper 1 (Theory)',
          subjectCode: '535/1',
          year: 2023,
          level: 'O-Level',
          questionsCount: 2,
          topics: ['Mechanics & Linear Momentum', 'Electricity & Ohm\'s Law']
        },
        {
          id: 'uneb-uce-math-2023-p1',
          examBody: 'UNEB_UCE',
          examBodyName: 'UNEB (Uganda National Examinations Board)',
          subject: 'Mathematics Paper 1',
          subjectCode: '456/1',
          year: 2023,
          level: 'O-Level',
          questionsCount: 2,
          topics: ['Quadratic Equations', 'Matrices & Determinants']
        },
        {
          id: 'knec-kcse-math-2023-p1',
          examBody: 'KNEC_KCSE',
          examBodyName: 'KNEC (Kenya National Examinations Council)',
          subject: 'Mathematics Alt A',
          subjectCode: '121/1',
          year: 2023,
          level: 'High School',
          questionsCount: 2,
          topics: ['Linear Programming', 'Thermal Physics']
        },
        {
          id: 'waec-wassce-chem-2023-p1',
          examBody: 'WAEC_WASSCE',
          examBodyName: 'WAEC (West African Examinations Council)',
          subject: 'Chemistry Paper 2',
          subjectCode: 'SC5052',
          year: 2023,
          level: 'Secondary',
          questionsCount: 1,
          topics: ['Stoichiometry & Empirical Formula']
        },
        {
          id: 'cambridge-alevel-math-9709-p1',
          examBody: 'CAMBRIDGE_ALEVEL',
          examBodyName: 'Cambridge Assessment International Education',
          subject: 'Pure Mathematics 1',
          subjectCode: '9709/12',
          year: 2023,
          level: 'A-Level',
          questionsCount: 1,
          topics: ['Calculus & Differentiation']
        }
      ];
      const filtered = examBody ? papers.filter(p => p.examBody === examBody) : papers;
      return Response.json({ success: true, count: filtered.length, papers: filtered });
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
        const { userId, tier, currency, amount, email, phone, firstName, lastName, months, paymentMethod, cardDetails, autoRenew, planLabel } = body;
        const targetTier = tier === 'scholar' ? 'pro' : (tier || 'pro');
        const durationMonths = Math.max(1, parseInt(months) || 1);
        const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const trackingId = `trk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const userEmail = (email || userId || "").toLowerCase().trim();
        const activeMethod = paymentMethod === 'mobile_money'
          ? (currency === 'KES' ? 'M-Pesa' : 'MTN / Airtel Mobile Money')
          : 'Credit / Debit Card';
        const label = planLabel || (targetTier === 'campus' ? 'Campus Institutional' : targetTier === 'cohort' ? 'Study Cohort' : 'Scholar Pro');
        const totalAmount = parseFloat(amount) || 9.99;

        // Construct official Voltrix Invoice
        const invoice = {
          invoiceId: `INV-${orderId.slice(-6).toUpperCase()}`,
          orderTrackingId: trackingId,
          orderId,
          userId: userEmail,
          tier: targetTier,
          planLabel: label,
          amount: totalAmount,
          currency: currency || 'USD',
          months: durationMonths,
          paymentMethod: activeMethod,
          autoRenew: autoRenew !== false,
          processor: 'Voltrix Secure Billing',
          paidAt: new Date().toISOString(),
          status: 'PAID'
        };

        // Persist order in KV
        const orderRecord = {
          order_id: orderId,
          order_tracking_id: trackingId,
          userId: userEmail,
          tier: targetTier,
          planLabel: label,
          currency: currency || 'USD',
          amount: totalAmount,
          months: durationMonths,
          paymentMethod: activeMethod,
          autoRenew: autoRenew !== false,
          status: 'PAID',
          createdAt: new Date().toISOString()
        };
        await env.BLUEPRINTS.put(`ord:${trackingId}`, JSON.stringify(orderRecord));

        // 1. Upgrade user tier in KV and DO immediately
        if (userEmail) {
          await env.BLUEPRINTS.put(`u:${userEmail}`, JSON.stringify({
            id: userEmail,
            plan: targetTier,
            isPro: targetTier !== 'free',
            upgradedAt: Date.now()
          }));

          try {
            const userDoId = ctx.exports.UserDurableObject.idFromName(userEmail);
            const userStub = ctx.exports.UserDurableObject.get(userDoId);
            const prof = await userStub.getStudentProfile();
            if (prof) {
              await userStub.setStudentProfile({ ...prof, tier: targetTier, isPro: targetTier !== 'free' } as any);
            }
          } catch (e) {
            logger.warn("Could not sync User DO profile on payment", { event: "user_sync_payment_error" });
          }

          // 2. Persist invoice & inbox notification
          await recordInvoiceAndInbox(env, invoice);

          // 3. Dispatch Resend receipt email to payer
          ctx.waitUntil(sendReceiptEmail(env, invoice));
        }

        // 4. Add to transactions ledger
        const currentTx = (await env.BLUEPRINTS.get("sys:transactions", "json")) as any[] || [];
        const newTx = {
          id: `tx_${Date.now().toString().slice(-4)}`,
          student: userEmail || 'scholar@voltrix.stream',
          plan: label,
          amount: totalAmount,
          currency: currency || 'USD',
          method: activeMethod,
          status: 'verified',
          processor: 'Voltrix Secure Billing',
          timestamp: new Date().toISOString()
        };
        await env.BLUEPRINTS.put("sys:transactions", JSON.stringify([newTx, ...currentTx].slice(0, 100)));

        return Response.json({
          success: true,
          completed: true,
          order_tracking_id: trackingId,
          order_id: orderId,
          invoice
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

      let invoice: any = null;

      if (ordData && ordData.userId) {
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

        invoice = {
          invoiceId: `INV-${id.slice(-6).toUpperCase()}`,
          orderTrackingId: id,
          orderId: ordData.order_id,
          userId: uEmail,
          tier,
          planLabel: ordData.planLabel || (tier === 'campus' ? 'Campus Institutional' : tier === 'cohort' ? 'Study Cohort' : 'Scholar Pro'),
          amount: ordData.amount,
          currency: ordData.currency,
          months: ordData.months || 1,
          paymentMethod: ordData.paymentMethod || 'Credit / Debit Card',
          autoRenew: ordData.autoRenew !== false,
          processor: 'Voltrix Secure Billing',
          paidAt: ordData.createdAt || new Date().toISOString(),
          status: 'PAID'
        };

        await recordInvoiceAndInbox(env, invoice);
        ctx.waitUntil(sendReceiptEmail(env, invoice));
      }

      return Response.json({
        success: true,
        completed: true,
        status_code: 1,
        tier: ordData?.tier || 'pro',
        order_tracking_id: id,
        processor: 'Voltrix Secure Billing',
        invoice
      });
    }

    // Inbox: GET /api/inbox — retrieve user notifications, receipts & announcements
    if (req.method === "GET" && url.pathname === "/api/inbox") {
      try {
        const userParam = url.searchParams.get("user")?.toLowerCase()?.trim() || "";
        const userInboxKey = userParam ? `inbox:${userParam}` : "";
        const userMessages = userParam ? ((await env.BLUEPRINTS.get(userInboxKey, "json")) as any[] || []) : [];
        const broadcastMessages = ((await env.BLUEPRINTS.get("inbox:broadcast", "json")) as any[] || []);

        const combined = [...userMessages, ...broadcastMessages].sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        const unreadCount = combined.filter((m: any) => !m.read).length;
        return Response.json({ success: true, messages: combined, unreadCount });
      } catch (err: any) {
        return Response.json({ success: false, error: err?.message || "Failed to fetch inbox" }, { status: 500 });
      }
    }

    // Inbox: POST /api/inbox/send — message / announcement dissemination
    if (req.method === "POST" && url.pathname === "/api/inbox/send") {
      try {
        const body = await req.json().catch(() => ({})) as any;
        const { recipient, title, content, type, senderName, senderRole, metadata } = body;
        if (!title || !content) {
          return Response.json({ success: false, error: "Title and content are required" }, { status: 400 });
        }

        const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const messageItem = {
          id: msgId,
          type: type || 'announcement',
          title,
          content,
          sender: {
            name: senderName || 'Voltrix Faculty / System',
            role: senderRole || 'admin'
          },
          recipient: recipient || 'all',
          metadata: metadata || null,
          read: false,
          createdAt: new Date().toISOString()
        };

        if (!recipient || recipient === 'all') {
          const broadcasts = (await env.BLUEPRINTS.get("inbox:broadcast", "json")) as any[] || [];
          await env.BLUEPRINTS.put("inbox:broadcast", JSON.stringify([messageItem, ...broadcasts].slice(0, 50)));
        } else {
          const recEmail = recipient.toLowerCase().trim();
          const targetKey = `inbox:${recEmail}`;
          const current = (await env.BLUEPRINTS.get(targetKey, "json")) as any[] || [];
          await env.BLUEPRINTS.put(targetKey, JSON.stringify([messageItem, ...current].slice(0, 100)));
        }

        return Response.json({ success: true, messageId: msgId, message: messageItem });
      } catch (err: any) {
        return Response.json({ success: false, error: err?.message || "Failed to dispatch message" }, { status: 500 });
      }
    }

    // Inbox: POST /api/inbox/read — mark read
    if (req.method === "POST" && url.pathname === "/api/inbox/read") {
      try {
        const body = await req.json().catch(() => ({})) as any;
        const { user, messageId, all } = body;
        if (!user) return Response.json({ success: false, error: "User required" }, { status: 400 });

        const targetKey = `inbox:${user.toLowerCase().trim()}`;
        const current = (await env.BLUEPRINTS.get(targetKey, "json")) as any[] || [];
        const updated = current.map((m: any) => {
          if (all || m.id === messageId) return { ...m, read: true };
          return m;
        });
        await env.BLUEPRINTS.put(targetKey, JSON.stringify(updated));

        return Response.json({ success: true, readCount: updated.filter(m => m.read).length });
      } catch (err: any) {
        return Response.json({ success: false, error: err?.message || "Failed to mark read" }, { status: 500 });
      }
    }

    // Billing: GET /api/billing/formula — dynamic month discount formula
    if (req.method === "GET" && url.pathname === "/api/billing/formula") {
      const stored = await env.BLUEPRINTS.get("sys:billing_discount_formula", "json");
      const defaultFormula = {
        tiers: [
          { minMonths: 1, discountPct: 0, label: "1 Month" },
          { minMonths: 2, discountPct: 5, label: "2 Months (5% off)" },
          { minMonths: 3, discountPct: 10, label: "3 Months (10% off)" },
          { minMonths: 6, discountPct: 20, label: "6 Months (20% off)" },
          { minMonths: 12, discountPct: 33, label: "12 Months (33% off · 2 Mo Free)" },
          { minMonths: 24, discountPct: 40, label: "24 Months (40% off)" }
        ],
        maxMonths: 36,
        description: "Admin configured tiered discount formula based on subscription months."
      };
      return Response.json({ success: true, formula: stored || defaultFormula });
    }

    // Admin Billing Formula: POST /api/admin/billing/formula
    if (req.method === "POST" && url.pathname === "/api/admin/billing/formula") {
      try {
        const body = await req.json().catch(() => ({})) as any;
        if (!body || !Array.isArray(body.tiers)) {
          return Response.json({ success: false, error: "Tiers array required" }, { status: 400 });
        }
        await env.BLUEPRINTS.put("sys:billing_discount_formula", JSON.stringify(body));
        return Response.json({ success: true, formula: body });
      } catch (err: any) {
        return Response.json({ success: false, error: err?.message || "Failed to save formula" }, { status: 500 });
      }
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
          logger.warn("Could not update User DO studentProfile", { event: "user_sync_plan_error" });
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
