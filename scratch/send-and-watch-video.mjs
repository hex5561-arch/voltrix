import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const SCREENSHOTS_DIR = "/home/voltrix/voltrix-os/cloudflare-os/screenshots/live_edge";
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CDP_PORT = 9239;
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

// 1. Direct navigation into the Calculus Video Finder workspace with Emma's token
console.log("Navigating directly to workspace with Emma auth...");
await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
await new Promise(r => setTimeout(r, 2000));

await evalCode(`localStorage.setItem('authToken', 'emma:CtbvtNoBaRh/vMWZOiOEXK1CIkACMamwxtY9R0pzXEY=')`);
await pageCdp.send("Page.navigate", { url: "https://voltrix.stream/workspace/1c0696dd85484f55e4932012f5f050d5fd2f6b599dcf57b68d39f426667cc1e5" });
await new Promise(r => setTimeout(r, 4000));

// Click on the existing chat session or send a message
console.log("Selecting existing session or typing prompt...");
await evalCode(`(() => {
  const sessionItems = Array.from(document.querySelectorAll('div, button')).filter(el => el.innerText?.includes('Initial Greeting Message'));
  if (sessionItems[0]) sessionItems[0].click();
})()`);
await new Promise(r => setTimeout(r, 1500));

// Type prompt into textarea using native setter
const query = "pull me a video from youtube explaining essence of calculus";
await evalCode(`(() => {
  const ta = document.querySelector('textarea');
  if (ta) {
    const valueSetter = Object.getOwnPropertyDescriptor(ta, 'value')?.set;
    const protoSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ta), 'value')?.set;
    if (protoSetter) protoSetter.call(ta, ${JSON.stringify(query)});
    else ta.value = ${JSON.stringify(query)};
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  }
})()`);
await new Promise(r => setTimeout(r, 500));

// Click send button
await evalCode(`(() => {
  // Click arrow up / submit button
  const form = document.querySelector('form');
  const btn = form?.querySelector('button[type=\"submit\"]') || document.querySelector('button.bg-kumo-brand, button.bg-indigo-600, form button:last-child');
  if (btn) btn.click();
})()`);

console.log("Message submitted! Waiting for agent to process and yield video...");
for (let i = 0; i < 25; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const status = await evalCode(`(() => {
    const text = document.body.innerText;
    const hasVideo = !!document.querySelector('iframe, [title*=\"Play\"], [title*=\"video\" i]');
    return { len: text.length, hasVideo };
  })()`);
  if (i % 5 === 0) console.log(`[${i}s] Status:`, status.result.value);
  if (status.result.value.hasVideo) break;
}

await captureScreenshot("edge-14-video-in-chat.png");

// Click Play in Gadget UI button if present, or switch to Gadget UI
const playClick = await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button, a'));
  const playBtn = btns.find(b => b.title?.includes('Gadget UI') || b.innerText?.includes('Play') || b.innerText?.includes('Watch'));
  if (playBtn) {
    playBtn.click();
    return "Clicked Play in Gadget UI: " + (playBtn.title || playBtn.innerText);
  }
  // Fallback to top pill bar
  const gadgetPill = btns.find(b => b.innerText?.trim() === 'Gadget UI');
  if (gadgetPill) {
    gadgetPill.click();
    return "Clicked Top Gadget UI Pill";
  }
  return "Neither found";
})()`);
console.log("Play action:", playClick.result.value);

await new Promise(r => setTimeout(r, 3000));
await captureScreenshot("edge-15-gadget-ui-playback.png");

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
