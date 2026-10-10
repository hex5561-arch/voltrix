import { spawn } from "node:child_process";

const CDP_PORT = 9245;
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
await new Promise(r => setTimeout(r, 1500));

const srcdoc = await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const f = document.querySelector('iframe[title=\"Gadget UI\"]');
    const container = f?.parentElement;
    return {
      srcdoc: f ? f.srcdoc : null,
      parentDisplay: container ? window.getComputedStyle(container).display : null,
      parentWidth: container?.offsetWidth,
      parentHeight: container?.offsetHeight,
      iframeComputedDisplay: f ? window.getComputedStyle(f).display : null,
      iframeComputedWidth: f ? window.getComputedStyle(f).width : null,
      iframeComputedHeight: f ? window.getComputedStyle(f).height : null,
    };
  })()`,
  returnByValue: true
});
console.log("Iframe details:\n", JSON.stringify(srcdoc.result.value, null, 2));

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
