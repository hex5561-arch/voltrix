import { spawn } from "node:child_process";

const CDP_PORT = 9237;
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

// Set mobile iPhone 390x844
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

// Wait for load and click Demos
for (let i = 0; i < 15; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const count = (await pageCdp.send("Runtime.evaluate", {
    expression: "document.querySelectorAll('button').length"
  })).result.value;
  if (count > 0) break;
}

await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const d = btns.find(b => b.innerText.includes('Demos'));
    if (d) d.click();
  })()`
});
await new Promise(r => setTimeout(r, 800));

await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const cards = Array.from(document.querySelectorAll('.rounded-2xl'));
    const emmaCard = cards.find(c => c.innerText.includes('Emma'));
    if (emmaCard) {
      const btn = emmaCard.querySelector('button');
      if (btn) btn.click();
    }
  })()`
});

await new Promise(r => setTimeout(r, 3000));

// Find links on the page (recent workspaces)
const links = await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      href: a.href,
      text: a.innerText.trim()
    })).filter(a => a.href.includes('/workspace/'));
  })()`,
  returnByValue: true
});
console.log("Workspace links found:", links.result.value);

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
