import { spawn } from "node:child_process";

const CDP_PORT = 9227;
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

await pageCdp.send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
  screenOrientation: { angle: 0, type: "portraitPrimary" },
});

await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
await new Promise(r => setTimeout(r, 2000));

// Click demos
await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demo = btns.find(b => b.innerText.includes('Demos'));
    if (demo) demo.click();
  })()`
});
await new Promise(r => setTimeout(r, 800));

const demoButtons = await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
  })()`,
  returnByValue: true
});
console.log("Buttons in demo dialog:", demoButtons.result.value);

// Let's click "Launch" or inspect how demo workspace is launched
const demoAction = await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const launch = btns.find(b => b.innerText.includes('Launch'));
    if (launch) {
      launch.click();
      return "Clicked Launch";
    }
    return "No launch button";
  })()`,
  returnByValue: true
});
console.log("Action:", demoAction.result.value);

for (let i = 0; i < 15; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const currentUrl = (await pageCdp.send("Runtime.evaluate", { expression: "window.location.href" })).result.value;
  console.log(`Current URL [${i}s]:`, currentUrl);
  if (currentUrl.includes("/workspace/")) break;
}

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
