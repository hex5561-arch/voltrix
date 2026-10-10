import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const SCREENSHOTS_DIR = "/home/voltrix/voltrix-os/cloudflare-os/screenshots/live_edge";
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CDP_PORT = 9229;
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

const testUser = "scholar_" + Math.floor(Math.random() * 89999 + 10000);
const testPass = "VoltrixTest2026!";

console.log("Navigating to https://voltrix.stream ...");
await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
await new Promise(r => setTimeout(r, 2500));

// Switch to Register tab
console.log("Switching to Register tab...");
await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const reg = btns.find(b => b.innerText.includes('Register'));
    if (reg) reg.click();
  })()`
});
await new Promise(r => setTimeout(r, 800));

// Fill in registration form
console.log("Filling in registration form for:", testUser);
await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const userInput = inputs.find(i => i.placeholder?.includes('username'));
    const nameInput = inputs.find(i => i.placeholder?.includes('Jane Doe') || i.placeholder?.includes('Full Name'));
    const passInput = inputs.find(i => i.placeholder?.includes('At least 8'));
    const confirmInput = inputs.find(i => i.placeholder?.includes('Re-type'));
    
    if (nameInput) {
      nameInput.value = 'Dr. Test Student';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (userInput) {
      userInput.value = '${testUser}';
      userInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (passInput) {
      passInput.value = '${testPass}';
      passInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (confirmInput) {
      confirmInput.value = '${testPass}';
      confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`
});
await new Promise(r => setTimeout(r, 500));

// Submit registration
await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const form = document.querySelector('form');
    if (form) {
      const btn = form.querySelector('button[type=\"submit\"]');
      if (btn) btn.click();
    }
  })()`
});

console.log("Submitted registration, waiting for workspace redirect...");
let inWorkspace = false;
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const url = (await pageCdp.send("Runtime.evaluate", { expression: "window.location.href" })).result.value;
  console.log(`URL [${i}s]:`, url);
  if (url.includes("/workspace/")) {
    inWorkspace = true;
    break;
  }
}

if (!inWorkspace) {
  // Check if we are still on login or on home
  const pageText = (await pageCdp.send("Runtime.evaluate", { expression: "document.body.innerText" })).result.value;
  console.log("Current page text snippet:", pageText.slice(0, 300));
}

// If we are in workspace, test mobile pill bar and ask for youtube video!
await new Promise(r => setTimeout(r, 3000));

const { data: shot1 } = await pageCdp.send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(path.join(SCREENSHOTS_DIR, "live-edge-01-logged-in.png"), Buffer.from(shot1, "base64"));

// Check for top pill bar
const pills = await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    return {
      hasChat: btns.some(t => t.includes('Chat')),
      hasGadget: btns.some(t => t.includes('Gadget UI')),
      buttons: btns
    };
  })()`,
  returnByValue: true
});
console.log("Pill buttons check:", pills.result.value);

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
