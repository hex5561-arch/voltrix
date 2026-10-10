import { spawn } from "node:child_process";

const CDP_PORT = 9250;
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

await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
await new Promise(r => setTimeout(r, 1500));
await pageCdp.send("Runtime.evaluate", {
  expression: `localStorage.setItem('authToken', 'emma:CtbvtNoBaRh/vMWZOiOEXK1CIkACMamwxtY9R0pzXEY=')`
});
await pageCdp.send("Page.navigate", { url: "https://voltrix.stream/workspace/1c0696dd85484f55e4932012f5f050d5fd2f6b599dcf57b68d39f426667cc1e5" });
await new Promise(r => setTimeout(r, 4500));

await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const gadgetPill = btns.find(b => b.innerText.includes('Gadget UI'));
    if (gadgetPill) gadgetPill.click();
  })()`
});
await new Promise(r => setTimeout(r, 2000));

// Find the target for the YouTube iframe!
const targets = await cdp.send("Target.getTargets");
const ytTarget = targets.targetInfos.find(t => t.url.includes("youtube"));
console.log("Found YouTube target:", ytTarget);

if (ytTarget) {
  const ytCdp = new CDPClient(`ws://127.0.0.1:${CDP_PORT}/devtools/page/${ytTarget.targetId}`);
  await ytCdp.init();
  await ytCdp.send("Page.enable");
  await ytCdp.send("Runtime.enable");
  
  const ytDoc = await ytCdp.send("Runtime.evaluate", {
    expression: "({ title: document.title, url: window.location.href, textSnippet: document.body?.innerText?.slice(0, 100) })",
    returnByValue: true
  });
  console.log("YouTube iframe inside content:", ytDoc.result.value);
  ytCdp.ws.close();
}

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
