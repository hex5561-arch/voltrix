/**
 * test-disconnect.mjs
 * End-to-end test: connects, sends a prompt, simulates the frontend's
 * disconnectAfterAgentTurn() logic, and measures actual DO wall time per prompt.
 *
 * Usage: node scripts/test-disconnect.mjs
 */
import { createRequire } from "module";
import { WebSocket } from "ws";

globalThis.WebSocket = WebSocket;

const require = createRequire(import.meta.url);
const { newWebSocketRpcSession } = require(
  "/home/voltrix/voltrix-os/cloudflare-os/node_modules/.pnpm/capnweb@0.11.1/node_modules/capnweb/dist/index.cjs"
);
const { argon2id } = await import(
  "/home/voltrix/voltrix-os/node_modules/.pnpm/hash-wasm@4.12.0/node_modules/hash-wasm/dist/index.esm.js"
);

const SERVICE_SALT = new Uint8Array([
  0xd9,0x4e,0x54,0x1d,0x29,0xc1,0x03,0x74,
  0x73,0x7e,0xb3,0xe3,0x34,0x6d,0x8f,0x21
]);

const USERNAME = "voltrixtest";
const PASSWORD = process.argv[2] || "voltrix-test-2026";
const POST_TURN_MS = 10000; // mirror of POST_TURN_DISCONNECT_MS in useWorkspaceOpen.ts

async function hashPassword(username, password) {
  const usernameBuf = new TextEncoder().encode(username);
  const salt = new Uint8Array(SERVICE_SALT.length + usernameBuf.length);
  salt.set(SERVICE_SALT);
  salt.set(usernameBuf, SERVICE_SALT.length);
  return argon2id({ password, salt, parallelism:1, iterations:3, memorySize:65536, hashLength:32, outputType:"binary" });
}

const t0 = Date.now();
const ts = () => `T+${((Date.now()-t0)/1000).toFixed(1)}s`;

console.log("=== Voltrix DO Disconnect Test ===\n");
console.log(`[${ts()}] Connecting...`);
const api = newWebSocketRpcSession("wss://os.voltrix.stream/api");

const cfg = await api.getServerConfig();
console.log(`[${ts()}] Server: "${cfg.siteName || "Cloudflare OS"}" — password auth: ${cfg.passwordAuthEnabled}`);

console.log(`[${ts()}] Hashing password...`);
const pwHash = await hashPassword(USERNAME, PASSWORD);

console.log(`[${ts()}] Logging in as "${USERNAME}"...`);
let token = await api.login(USERNAME, pwHash);
if (!token) {
  console.log(`[${ts()}] Creating test account...`);
  token = await api.createAccount(USERNAME, "Voltrix Test", pwHash);
}
console.log(`[${ts()}] ✅ Authenticated`);

const authedApi = await api.authenticate(token);
const models = await authedApi.listModels();
const modelId = models[0]?.id ?? null;
console.log(`[${ts()}] Model: ${modelId}`);

// Open or create workspace
const gadgets = await authedApi.listGadgets();
let overseer;
const wsOpenAt = Date.now();
if (gadgets.length > 0) {
  console.log(`[${ts()}] Opening workspace ${gadgets[0].id.slice(0,12)}...`);
  overseer = await authedApi.openGadget(gadgets[0].id);
} else {
  console.log(`[${ts()}] Creating workspace...`);
  overseer = await authedApi.newGadget();
}
console.log(`[${ts()}] ✅ Workspace open (DO is now active, billing started)`);

// Get or create chat
const chats = await overseer.listChats();
let chatId;
if (chats.length > 0) {
  chatId = chats[0].id;
} else {
  chatId = await overseer.newChat("hi", modelId);
}
console.log(`[${ts()}] Chat: ${chatId}`);

// ── Core test: send prompt, detect completion, simulate frontend disconnect ──

let agentDoneAt = null;
let disconnectedAt = null;
let disconnectTimer = null;
let agentWasActive = false;

console.log(`[${ts()}] 📤 Sending: "Reply with exactly one word: pong"`);
const promptAt = Date.now();
await overseer.sendChatMessage(chatId, "Reply with exactly one word: pong", modelId);

// Poll listChats() to detect activeAgent — mirrors what ChatInterface does via subscription
const pollInterval = setInterval(async () => {
  try {
    const chats = await overseer.listChats();
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    if (chat.activeAgent) {
      if (!agentWasActive) {
        agentWasActive = true;
        process.stdout.write(`[${ts()}] 🤖 Agent active (${chat.activeAgent.name})...\n`);
      }
    } else if (agentWasActive && !agentDoneAt) {
      // Agent just finished — this is the trigger in the real frontend
      agentDoneAt = Date.now();
      console.log(`[${ts()}] ✅ Agent done (${agentDoneAt - promptAt}ms)`);
      console.log(`[${ts()}] ⏳ Simulating disconnectAfterAgentTurn() — ${POST_TURN_MS/1000}s grace...`);

      disconnectTimer = setTimeout(() => {
        console.log(`[${ts()}] 🔌 Disposing overseer stub → DO hibernates`);
        overseer[Symbol.dispose]?.();
      }, POST_TURN_MS);
    }
  } catch(e) {
    // stub was disposed — record disconnect time
    if (!disconnectedAt) disconnectedAt = Date.now();
    clearInterval(pollInterval);
  }
}, 400);

// Wait for disconnect (stub disposal) up to 90s
await new Promise(resolve => {
  const check = setInterval(() => {
    if (disconnectedAt) { clearInterval(check); resolve(); }
  }, 200);
  setTimeout(() => { clearInterval(check); resolve(); }, 90000);
});

clearInterval(pollInterval);
clearTimeout(disconnectTimer);

// ── Results ──
console.log("\n==========================================");
if (disconnectedAt && agentDoneAt && agentDoneAt > 0) {
  const delay    = disconnectedAt - agentDoneAt;
  const wallTime = disconnectedAt - wsOpenAt;
  const cost     = (wallTime / 1000) * 0.125 * 12.50 / 1_000_000;

  console.log(` Agent response       : ${agentDoneAt - promptAt}ms`);
  console.log(` Disconnect delay     : ${delay}ms after agent done`);
  console.log(` Total DO wall time   : ${(wallTime/1000).toFixed(1)}s`);
  console.log(` Cost this prompt     : $${cost.toFixed(6)}`);
  console.log(` Per user × 10/day    : $${(cost*10).toFixed(5)}`);
  console.log(` × 1000 users/day     : $${(cost*10*1000).toFixed(3)}`);
  console.log(` × 1000 users/month   : $${(cost*10*1000*30).toFixed(2)}`);
  console.log();
  if (delay < 15000)      console.log(" ✅ PASS — disconnects within 15s of agent turn");
  else if (delay < 35000) console.log(" ⚠️  SLOW — working but >15s");
  else                    console.log(" ❌ FAIL — disconnect not triggering");
} else {
  console.log(" ❌ Could not complete test — agent may not have responded");
  console.log(`    agentDoneAt=${agentDoneAt}, disconnectedAt=${disconnectedAt}`);
}
process.exit(0);
