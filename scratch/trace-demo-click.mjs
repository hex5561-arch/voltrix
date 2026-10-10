import { spawn } from "node:child_process";

const CDP_PORT = 9236;
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

await pageCdp.send("Network.enable");
await pageCdp.send("Page.enable");
await pageCdp.send("Runtime.enable");

pageCdp.on("Network.requestWillBeSent", (p) => {
  console.log("FETCH:", p.request.method, p.request.url);
});
pageCdp.on("Network.responseReceived", (p) => {
  console.log("RESP:", p.response.status, p.response.url);
});
pageCdp.on("Runtime.consoleAPICalled", (p) => {
  console.log("CONSOLE:", p.type, p.args?.map(a => a.value || a.description).join(" "));
});
pageCdp.on("Runtime.exceptionThrown", (p) => {
  console.error("EXCEPTION:", p.exceptionDetails?.exception?.description || p.exceptionDetails?.text);
});

await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });

// Wait until document has loaded
for (let i = 0; i < 15; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const count = (await pageCdp.send("Runtime.evaluate", {
    expression: "document.querySelectorAll('button').length"
  })).result.value;
  console.log(`[${i}s] button count:`, count);
  if (count > 0) break;
}

// Click Demos
await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const d = btns.find(b => b.innerText.includes('Demos'));
    if (d) d.click();
  })()`
});
await new Promise(r => setTimeout(r, 1000));

// Click Emma's Launch button
console.log("Clicking Emma launch...");
const clickRes = await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const cards = Array.from(document.querySelectorAll('.rounded-2xl'));
    const emmaCard = cards.find(c => c.innerText.includes('Emma'));
    if (emmaCard) {
      const btn = emmaCard.querySelector('button');
      if (btn) {
        btn.click();
        return "Clicked Emma launch button";
      }
    }
    // Fallback: any launch button
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Launch'));
    if (btns[0]) {
      btns[0].click();
      return "Clicked first launch button";
    }
    return "No button found";
  })()`,
  returnByValue: true
});
console.log("Click result:", clickRes.result.value);

for (let i = 0; i < 10; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const info = await pageCdp.send("Runtime.evaluate", {
    expression: `({
      url: window.location.href,
      token: localStorage.getItem('authToken'),
      textSnippet: document.body.innerText.slice(0, 150)
    })`,
    returnByValue: true
  });
  console.log(`[${i}s]`, info.result.value);
}

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
