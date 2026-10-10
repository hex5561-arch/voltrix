import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const SCREENSHOTS_DIR = "/home/voltrix/voltrix-os/cloudflare-os/screenshots/live_edge";
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CDP_PORT = 9247;
const chromeProc = spawn("/usr/bin/chromium", [
  "--headless=new",
  `--remote-debugging-port=${CDP_PORT}`,
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
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
await pageCdp.send("Page.enable");
await pageCdp.send("Runtime.enable");

async function evalCode(expression) {
  return await pageCdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
  });
}

async function captureScreenshot(filename) {
  const { data } = await pageCdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, filename), Buffer.from(data, "base64"));
  console.log(`Saved screenshot: ${filename}`);
}

await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
await new Promise(r => setTimeout(r, 1500));
await evalCode(`localStorage.setItem('authToken', 'emma:CtbvtNoBaRh/vMWZOiOEXK1CIkACMamwxtY9R0pzXEY=')`);
await pageCdp.send("Page.navigate", { url: "https://voltrix.stream/workspace/1c0696dd85484f55e4932012f5f050d5fd2f6b599dcf57b68d39f426667cc1e5" });

// Wait until conversation is loaded and messages rendered
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const isLoaded = (await evalCode("!document.body.innerText.includes('Loading conversation...')")).result.value;
  console.log(`Waiting for conversation... [${i}s] loaded=${isLoaded}`);
  if (isLoaded) break;
}

// 1. Capture Chat view with the Top Segmented Switcher Pill Bar ([💬 Chat] [⚡ Gadget UI 🟠] [</> Code])
await captureScreenshot("edge-final-01-chat-with-switcher.png");

// 2. Switch to Gadget UI via Top Segmented Switcher Pill
console.log("Switching to Gadget UI view...");
await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const gadgetPill = btns.find(b => b.innerText.includes('Gadget UI'));
  if (gadgetPill) gadgetPill.click();
})()`);

await new Promise(r => setTimeout(r, 4000));

// 3. Capture Gadget UI view playing YouTube video
await captureScreenshot("edge-final-02-gadget-ui-playing-youtube.png");

// 4. Switch back to Chat view smoothly
console.log("Switching back to Chat view...");
await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const chatPill = btns.find(b => b.innerText.includes('Chat'));
  if (chatPill) chatPill.click();
})()`);

await new Promise(r => setTimeout(r, 1500));

// 5. Capture Chat view back with no loss of state
await captureScreenshot("edge-final-03-back-to-chat-intact.png");

console.log("All flows captured successfully on Cloudflare Edge!");

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
