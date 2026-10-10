import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const SCREENSHOTS_DIR = "/home/voltrix/voltrix-os/cloudflare-os/screenshots/live_edge";
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CDP_PORT = 9231;
const chromeProc = spawn("/usr/bin/chromium", [
  "--headless=new",
  `--remote-debugging-port=${CDP_PORT}`,
  "--no-sandbox",
  "--disable-gpu",
  "about:blank",
]);

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

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.pending = new Map();
    this.handlers = new Map();
  }
  async init() {
    return new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
      this.ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
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

const cdp = new CDPClient(cdpWsUrl);
await cdp.init();
const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const pageCdp = new CDPClient(`ws://127.0.0.1:${CDP_PORT}/devtools/page/${targetId}`);
await pageCdp.init();

await pageCdp.send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
  screenOrientation: { angle: 0, type: "portraitPrimary" },
});
await pageCdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await pageCdp.send("Page.enable");
await pageCdp.send("Runtime.enable");

pageCdp.on("Runtime.consoleAPICalled", (p) => {
  console.log("CONSOLE:", p.type, p.args?.map(a => a.value || a.description).join(" "));
});
pageCdp.on("Runtime.exceptionThrown", (p) => {
  console.error("EXCEPTION:", p.exceptionDetails?.exception?.description || p.exceptionDetails?.text);
});

console.log("Navigating to https://voltrix.stream ...");
await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
await new Promise(r => setTimeout(r, 2000));

// Call rpcStub.createAccount or rpcStub.login directly in browser context!
console.log("Creating/authenticating test user via browser context...");
const authResult = await pageCdp.send("Runtime.evaluate", {
  expression: `(async () => {
    try {
      // Check window.rpcStub or create token
      const username = 'scholar_' + Date.now().toString(36);
      const password = 'Password123!';
      
      // Let's use subtle crypto to hash password like LoginPage does
      const enc = new TextEncoder();
      const salt = enc.encode(username.toLowerCase());
      const passBytes = enc.encode(password);
      const combined = new Uint8Array(salt.length + passBytes.length);
      combined.set(salt);
      combined.set(passBytes, salt.length);
      const hashBuf = await crypto.subtle.digest('SHA-256', combined);
      const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Let's call the rpcStub from app or import
      // We can also see if there's any active rpc stub
      return { username, hashHex };
    } catch (e) {
      return { error: e.message };
    }
  })()`,
  awaitPromise: true,
  returnByValue: true
});
console.log("Auth crypto test:", authResult.result.value);

// Let's inspect React state / root
const rootInfo = await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    return {
      hasAuthToken: !!localStorage.getItem('authToken'),
      url: window.location.href,
      htmlTitle: document.title
    };
  })()`,
  returnByValue: true
});
console.log("Current state:", rootInfo.result.value);

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
