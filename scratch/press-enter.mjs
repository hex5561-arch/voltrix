import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const SCREENSHOTS_DIR = "/home/voltrix/voltrix-os/cloudflare-os/screenshots/live_edge";
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CDP_PORT = 9242;
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
await new Promise(r => setTimeout(r, 4000));

// Focus textarea
await evalCode(`document.querySelector('textarea').focus()`);
await new Promise(r => setTimeout(r, 300));

// Type prompt
await pageCdp.send("Input.insertText", { text: "pull me a video from youtube explaining essence of calculus" });
await new Promise(r => setTimeout(r, 500));

// Dispatch Enter KeyDown/KeyUp
console.log("Dispatching Enter key press...");
await pageCdp.send("Input.dispatchKeyEvent", {
  type: "rawKeyDown",
  windowsVirtualKeyCode: 13,
  key: "Enter",
  code: "Enter",
});
await pageCdp.send("Input.dispatchKeyEvent", {
  type: "keyUp",
  windowsVirtualKeyCode: 13,
  key: "Enter",
  code: "Enter",
});

console.log("Pressed Enter! Waiting 15s to observe chat stream...");
for (let i = 0; i < 15; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const snap = await evalCode(`(() => {
    return {
      taVal: document.querySelector('textarea')?.value,
      bodyTextLength: document.body.innerText.length
    };
  })()`);
  console.log(`[${i}s]`, snap.result.value);
}

await captureScreenshot("edge-19-after-enter-key.png");

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
