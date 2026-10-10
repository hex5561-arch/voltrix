import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const SCREENSHOTS_DIR = "/home/voltrix/voltrix-os/cloudflare-os/screenshots/live_edge";
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CDP_PORT = 9241;
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

await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
await new Promise(r => setTimeout(r, 1500));
await evalCode(`localStorage.setItem('authToken', 'emma:CtbvtNoBaRh/vMWZOiOEXK1CIkACMamwxtY9R0pzXEY=')`);
await pageCdp.send("Page.navigate", { url: "https://voltrix.stream/workspace/1c0696dd85484f55e4932012f5f050d5fd2f6b599dcf57b68d39f426667cc1e5" });
await new Promise(r => setTimeout(r, 4000));

// Focus textarea and type via Input.insertText so React controlled component updates state properly!
console.log("Focusing textarea and typing text via CDP Input.insertText...");
await evalCode(`document.querySelector('textarea').focus()`);
await new Promise(r => setTimeout(r, 300));

await pageCdp.send("Input.insertText", { text: "pull me a video from youtube explaining essence of calculus" });
await new Promise(r => setTimeout(r, 500));

// Check if Send button is enabled
const sendStatus = await evalCode(`(() => {
  const btn = document.querySelector('button[aria-label=\"Send message\"]');
  return { found: !!btn, disabled: btn?.disabled, className: btn?.className };
})()`);
console.log("Send button status after typing:", sendStatus.result.value);

// Click Send button
await evalCode(`(() => {
  const btn = document.querySelector('button[aria-label=\"Send message\"]');
  if (btn) btn.click();
})()`);

console.log("Clicked Send button! Waiting for agent streaming...");
for (let i = 0; i < 25; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const snap = await evalCode(`(() => {
    const bubbles = Array.from(document.querySelectorAll('.prose, [data-message-id], .rounded-2xl')).map(el => el.innerText.trim()).filter(Boolean);
    const hasCard = !!document.querySelector('[title*=\"Play\"], [title*=\"Gadget\"], iframe');
    return { count: bubbles.length, hasCard, snippet: bubbles[bubbles.length - 1]?.slice(0, 100) };
  })()`);
  if (i % 5 === 0) console.log(`[${i}s]`, snap.result.value);
  if (snap.result.value.hasCard || (snap.result.value.snippet && snap.result.value.snippet.length > 50)) {
    // Keep waiting for full card
    if (snap.result.value.hasCard) break;
  }
}

await captureScreenshot("edge-16-agent-streaming-in-chat.png");

// Switch to Gadget UI
console.log("Switching to Gadget UI view...");
await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const gadget = btns.find(b => b.innerText.includes('Gadget UI'));
  if (gadget) gadget.click();
})()`);
await new Promise(r => setTimeout(r, 3000));
await captureScreenshot("edge-17-gadget-ui-view.png");

// Switch back to Chat
console.log("Switching back to Chat...");
await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const chat = btns.find(b => b.innerText.includes('Chat'));
  if (chat) chat.click();
})()`);
await new Promise(r => setTimeout(r, 1500));
await captureScreenshot("edge-18-back-to-chat.png");

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
