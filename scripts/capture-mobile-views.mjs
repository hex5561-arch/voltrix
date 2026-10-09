import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { RpcSession, WebSocketTransport } from "../node_modules/.pnpm/capnweb@0.11.1/node_modules/capnweb/dist/index.js";
import { WebSocketServer } from "ws";

const ROOT = "/home/voltrix/voltrix-os/cloudflare-os";
const DIST_DIR = path.join(ROOT, "packages/workshop-frontend/dist");
const SCREENSHOTS_DIR = path.join(ROOT, "screenshots");
const PORT = 4180;
const CDP_PORT = 9225;

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// 1. Mock Capnweb RPC backend
const mockAuthenticatedApi = {
  whoami: async () => ({
    type: "user",
    id: "scholar-elena@ethz.ch",
    name: "Elena Rostova (ETH Zürich)",
  }),
  amIAdmin: async () => true,
  isOnboardingCompleted: async () => true,
  listModels: async () => [
    { id: "socratic-claude", name: "Voltrix Socratic Scholar (Claude 3.7)", type: "model" },
    { id: "gpt-4o-academic", name: "GPT-4o Academic Reasoner", type: "model" },
  ],
  listWorkspaces: async () => [
    { id: "ws-algo", title: "Distributed Algorithms & Consensus", lastModified: Date.now() },
    { id: "ws-calc", title: "Multivariable Calculus III", lastModified: Date.now() - 3600000 },
    { id: "ws-neuro", title: "Computational Neuroscience", lastModified: Date.now() - 7200000 },
  ],
  listGatekeepers: async () => [
    { id: "google", title: "Google Classroom & Drive", description: "Sync lecture notes, assignments, and slides" },
    { id: "email", title: "University Webmail", description: "Institutional email notifications and announcements" },
    { id: "github", title: "GitHub Academic Repos", description: "Code review, homework repos, and CI" },
  ],
  listGadgets: async () => [
    { id: "ws-algo", title: "Distributed Algorithms & Consensus", lastModified: Date.now(), lastActive: new Date() },
    { id: "ws-calc", title: "Multivariable Calculus III", lastModified: Date.now() - 3600000, lastActive: new Date(Date.now() - 3600000) },
  ],
  listGatekeeperApps: async () => [],
  listGatekeeperVendors: async () => [],
  listAddableGatekeepers: async () => [],
  listFeaturedBlueprints: async () => [
    {
      id: "bp-flashcards",
      metadata: {
        title: "Socratic Flashcard Deck",
        description: "Active recall for engineering concepts",
        bindings: [],
      },
      noun: "Flashcards",
      icon: "sparkle",
    },
    {
      id: "bp-exam",
      metadata: {
        title: "Kenya National Academic Exam Drill",
        description: "Timed KNEC / university exam simulator with Socratic hints",
        bindings: [],
      },
      noun: "Exam",
      icon: "book",
    },
  ],
  listOwnBlueprints: async () => [],
  listLibraryBlueprints: async () => [],
  openGadget: (id) => ({
    subscribeWorkpieces: () => ({ [Symbol.dispose]: () => {} }),
    subscribeToWorkpieces: () => ({ [Symbol.dispose]: () => {} }),
    subscribeConsoleLogs: () => ({ [Symbol.dispose]: () => {} }),
    subscribeToConsoleLogs: () => ({ [Symbol.dispose]: () => {} }),
    subscribeActions: () => ({ [Symbol.dispose]: () => {} }),
    subscribeToActions: () => ({ [Symbol.dispose]: () => {} }),
    subscribeToMetadata: () => ({ [Symbol.dispose]: () => {} }),
    load: async () => ({ id, title: "Academic Gadget", lastActive: new Date() }),
    [Symbol.dispose]: () => {},
  }),
  subscribeConnectedAccounts: () => ({
    [Symbol.dispose]: () => {},
  }),
  getAdminApi: async () => ({
    getSettings: async () => ({
      signupsEnabled: true,
      siteName: "Voltrix OS Academic Studio",
      instanceInstructions: "Guide students using Socratic pedagogy and Kenyan national academic standards.",
      announcement: "Semester 2 Examinations underway. Timetables and portfolio tracking active.",
      banner: { text: "Academic Sprint 2026 Active", color: "indigo" },
      accentColor: "#0284c7",
      resourceVendors: [],
      formats: [],
    }),
    [Symbol.dispose]: () => {},
  }),
  listBlueprints: async () => [
    { id: "bp-flashcards", title: "Socratic Flashcard Deck", description: "Active recall for engineering concepts", noun: "Flashcards", icon: "sparkle" },
    { id: "bp-formula", title: "Formula Sheet Synthesizer", description: "LaTeX equation summary generator", noun: "FormulaSheet", icon: "pencil" },
  ],
  newGadget: () => ({
    [Symbol.dispose]: () => {},
  }),
  subscribeToAccounts: () => ({
    [Symbol.dispose]: () => {},
  }),
  [Symbol.dispose]: () => {},
};

const mockPublicApi = {
  getServerConfig: async () => ({
    siteName: "Voltrix OS Academic Studio",
    authVendors: [],
    cloudflareLimitsEnabled: false,
  }),
  login: async () => "mock-token-12345",
  createAccount: async () => "mock-token-12345",
  authenticate: () => mockAuthenticatedApi,
  authenticateFromCfAccess: () => mockAuthenticatedApi,
};

// 2. HTTP Server + WebSocket RPC
const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === "/api/inbox") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ unreadCount: 1, items: [] }));
    return;
  }
  if (url.pathname === "/api/site-logo") {
    res.writeHead(200, { "Content-Type": "image/svg+xml" });
    res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#0284c7" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`);
    return;
  }
  if (url.pathname === "/api/auth/demo-login") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, token: "mock-token-12345" }));
    return;
  }

  let filePath = path.join(DIST_DIR, url.pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, "index.html");
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
});

const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/api")) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      new RpcSession(new WebSocketTransport(ws), mockPublicApi);
    });
  } else {
    socket.destroy();
  }
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`Test preview server running at http://127.0.0.1:${PORT}`);

// 3. Launch Chromium
const chromeDataDir = "/tmp/chrome-mobile-" + Date.now();
fs.mkdirSync(chromeDataDir, { recursive: true });

const chromeProc = spawn("/usr/bin/chromium", [
  "--headless=new",
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${chromeDataDir}`,
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "about:blank",
], {
  stdio: ["ignore", "pipe", "pipe"],
});

chromeProc.stdout.on("data", () => {});
chromeProc.stderr.on("data", (d) => {
  const msg = d.toString();
  if (msg.includes("DevTools listening")) {
    console.log("Chromium started:", msg.trim());
  }
});

// Wait for CDP to be ready
let cdpWsUrl = null;
for (let i = 0; i < 50; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    if (res.ok) {
      const data = await res.json();
      cdpWsUrl = data.webSocketDebuggerUrl;
      if (cdpWsUrl) break;
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 200));
}

if (!cdpWsUrl) {
  throw new Error("Could not connect to Chromium CDP on port " + CDP_PORT);
}
console.log("Connected to Chromium CDP at", cdpWsUrl);

// CDP Client Helper
class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.pending = new Map();
    this.handlers = new Map();
  }
  async init() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        } else if (msg.method) {
          const handler = this.handlers.get(msg.method);
          if (handler) handler(msg.params);
        }
      };
    });
  }
  send(method, params = {}) {
    const reqId = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(reqId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }
  on(method, handler) {
    this.handlers.set(method, handler);
  }
}

// Create new target for page
const browserCdp = new CDPClient(cdpWsUrl);
await browserCdp.init();

const { targetId } = await browserCdp.send("Target.createTarget", { url: "about:blank" });
const targetWsUrl = `ws://127.0.0.1:${CDP_PORT}/devtools/page/${targetId}`;
const pageCdp = new CDPClient(targetWsUrl);
await pageCdp.init();

// Configure mobile emulation: iPhone 13/14/15 size: 390 x 844, scale 2
await pageCdp.send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
  screenOrientation: { angle: 0, type: "portraitPrimary" },
});
await pageCdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await pageCdp.send("Network.setUserAgentOverride", {
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

await pageCdp.send("Page.enable");
await pageCdp.send("Runtime.enable");

// Listen for errors and console output
const errorsDetected = [];
pageCdp.on("Runtime.exceptionThrown", (params) => {
  const desc = params.exceptionDetails?.exception?.description || params.exceptionDetails?.text;
  console.error("PAGE EXCEPTION:", desc);
  errorsDetected.push(desc);
});
pageCdp.on("Runtime.consoleAPICalled", (params) => {
  if (params.type === "error") {
    const text = params.args.map((a) => a.value || a.description).join(" ");
    console.error("CONSOLE ERROR:", text);
    if (!text.includes("favicon")) {
      errorsDetected.push(text);
    }
  }
});

// Setup auth token in localStorage on every document before React runs
await pageCdp.send("Page.addScriptToEvaluateOnNewDocument", {
  source: `
    try {
      localStorage.setItem('authToken', 'mock-token-12345');
      localStorage.setItem('gadgets:student-profile', JSON.stringify({
        id: 'student-elena',
        name: 'Elena Rostova',
        university: 'ETH Zürich',
        academicLevel: 'Undergraduate Student',
        discipline: 'computer_science',
        targetCohortYear: 2026,
        academicVelocity: 94,
        semesterWeeksRemaining: 6
      }));
    } catch (e) {}
  `,
});

// Helper: Take screenshot and write to file
async function captureScreenshot(filename) {
  const { data } = await pageCdp.send("Page.captureScreenshot", { format: "png" });
  const outPath = path.join(SCREENSHOTS_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
  const stats = fs.statSync(outPath);
  console.log(`Saved screenshot: ${filename} (${Math.round(stats.size / 1024)} KB)`);
}

// Helper: Wait for selector to exist in DOM
async function waitForSelector(selector, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await pageCdp.send("Runtime.evaluate", {
      expression: `!!document.querySelector('${selector}')`,
      returnByValue: true,
    });
    if (res.result?.value) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

// Helper: Navigate and wait for idle
async function navigateTo(urlPath, waitMs = 1500) {
  await pageCdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}${urlPath}` });
  await new Promise((r) => setTimeout(r, waitMs));
}

console.log("\n--- Starting Mobile Views Capture ---");

// 1. Home / Chat interface (Mobile view)
console.log("Capturing 01-mobile-home-chat.png...");
await navigateTo("/");
await waitForSelector("textarea, .chatInputRoot, button", 4000);
await new Promise((r) => setTimeout(r, 1000));
await captureScreenshot("01-mobile-home-chat.png");

// 2. Mobile Nav Drawer / Hamburger Menu opened
console.log("Capturing 02-mobile-nav-drawer.png...");
await pageCdp.send("Runtime.evaluate", {
  expression: `
    (() => {
      // Find hamburger button
      const buttons = Array.from(document.querySelectorAll('button'));
      const hamburger = buttons.find(b => b.getAttribute('aria-label')?.toLowerCase().includes('menu') || b.querySelector('svg'));
      if (hamburger) hamburger.click();
    })()
  `,
});
await new Promise((r) => setTimeout(r, 800));
await captureScreenshot("02-mobile-nav-drawer.png");

// Close drawer
await pageCdp.send("Runtime.evaluate", {
  expression: `
    const overlay = document.querySelector('.backdrop-blur-\\\\[1px\\\\], [aria-hidden="true"]');
    if (overlay) overlay.click();
  `,
});
await new Promise((r) => setTimeout(r, 400));

// 3. Explore Blueprints
console.log("Capturing 03-mobile-explore.png...");
await navigateTo("/explore");
await new Promise((r) => setTimeout(r, 1200));
await captureScreenshot("03-mobile-explore.png");

// 4. Gatekeepers
console.log("Capturing 04-mobile-gatekeepers.png...");
await navigateTo("/gatekeepers");
await new Promise((r) => setTimeout(r, 1200));
await captureScreenshot("04-mobile-gatekeepers.png");

// 5. Profile & Settings
console.log("Capturing 05-mobile-profile.png...");
await navigateTo("/profile");
await new Promise((r) => setTimeout(r, 1200));
await captureScreenshot("05-mobile-profile.png");

// 6. Pricing & Billing (Public Route with M-Pesa / Card tabs)
console.log("Capturing 06-mobile-pricing.png...");
await navigateTo("/pricing");
await new Promise((r) => setTimeout(r, 1200));
await captureScreenshot("06-mobile-pricing.png");

// 7. Admin Command Center
console.log("Capturing 07-mobile-admin.png...");
await navigateTo("/admin");
await new Promise((r) => setTimeout(r, 1500));
await captureScreenshot("07-mobile-admin.png");

// 8. Login Page (Cleared token)
console.log("Capturing 08-mobile-login.png...");
await pageCdp.send("Runtime.evaluate", {
  expression: `
    localStorage.removeItem('authToken');
  `,
});
await navigateTo("/");
await waitForSelector("form, input, button", 4000);
await new Promise((r) => setTimeout(r, 1000));
await captureScreenshot("08-mobile-login.png");

// Restore auth token for gadget/modal tests
await pageCdp.send("Runtime.evaluate", {
  expression: `
    localStorage.setItem('authToken', 'mock-token-12345');
  `,
});
await navigateTo("/");

// 9. Interactive Exam Gadget
console.log("Capturing 09-mobile-exam-gadget.png...");
await pageCdp.send("Runtime.evaluate", {
  expression: `
    window.dispatchEvent(new CustomEvent('voltrix-open-exam-gadget', {
      detail: { paperId: 'paper-knec-cs-2024', questionId: 'q1' }
    }));
  `,
});
await new Promise((r) => setTimeout(r, 800));
await captureScreenshot("09-mobile-exam-gadget.png");

// Close Exam Gadget
await pageCdp.send("Runtime.evaluate", {
  expression: `
    const closeBtn = document.querySelector('[aria-label="Close dialog"], [aria-label="Close interactive exam"], button:has(svg)');
    if (closeBtn) closeBtn.click();
  `,
});
await new Promise((r) => setTimeout(r, 400));

// 10. Timetable & Velocity Engine
console.log("Capturing 10-mobile-timetable-velocity.png...");
await pageCdp.send("Runtime.evaluate", {
  expression: `
    window.dispatchEvent(new CustomEvent('voltrix-open-timetable'));
  `,
});
await new Promise((r) => setTimeout(r, 800));
await captureScreenshot("10-mobile-timetable-velocity.png");

// Close Timetable
await pageCdp.send("Runtime.evaluate", {
  expression: `
    const closeBtn = document.querySelector('[aria-label="Close dialog"], button:has(svg)');
    if (closeBtn) closeBtn.click();
  `,
});
await new Promise((r) => setTimeout(r, 400));

// 11. Coursework Portfolio Auditor
console.log("Capturing 11-mobile-coursework-portfolio.png...");
await pageCdp.send("Runtime.evaluate", {
  expression: `
    window.dispatchEvent(new CustomEvent('voltrix-open-portfolio'));
  `,
});
await new Promise((r) => setTimeout(r, 800));
await captureScreenshot("11-mobile-coursework-portfolio.png");

console.log("\n--- Verification Summary ---");
console.log(`Detected Errors/Exceptions during run: ${errorsDetected.length}`);
if (errorsDetected.length > 0) {
  console.log("Errors:", errorsDetected);
}

// Cleanup
browserCdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
server.close();

console.log("All screenshots captured and verified successfully!");
process.exit(0);
