import { spawn } from "node:child_process";

const CDP_PORT = 9230;
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

pageCdp.on("Runtime.exceptionThrown", (p) => {
  console.log("EXCEPTION:", p.exceptionDetails?.exception?.description || p.exceptionDetails?.text);
});
pageCdp.on("Runtime.consoleAPICalled", (p) => {
  console.log("CONSOLE:", p.type, p.args?.map(a => a.value || a.description).join(" "));
});

await pageCdp.send("Page.enable");
await pageCdp.send("Runtime.enable");

await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
await new Promise(r => setTimeout(r, 2000));

// Click Register
await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const reg = btns.find(b => b.innerText.includes('Register'));
    if (reg) reg.click();
  })()`
});
await new Promise(r => setTimeout(r, 500));

const res = await pageCdp.send("Runtime.evaluate", {
  expression: `(async () => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const user = inputs.find(i => i.placeholder?.includes('username'));
    const pass = inputs.find(i => i.placeholder?.includes('At least 8'));
    const conf = inputs.find(i => i.placeholder?.includes('Re-type'));
    const name = inputs.find(i => i.placeholder?.includes('Jane Doe'));
    if (user) user.value = 'teststudent99';
    if (pass) pass.value = 'Password123!';
    if (conf) conf.value = 'Password123!';
    if (name) name.value = 'Test Student';
    
    // dispatch events
    [user, pass, conf, name].filter(Boolean).forEach(el => {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    const form = document.querySelector('form');
    console.log("Form found:", !!form);
    const btn = form?.querySelector('button[type=\"submit\"]');
    console.log("Submit btn:", btn?.innerText, "disabled:", btn?.disabled);
    if (btn) btn.click();
    return "Clicked";
  })()`,
  awaitPromise: true,
  returnByValue: true
});
console.log("Submit result:", res);

for (let i = 0; i < 5; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const errBanner = await pageCdp.send("Runtime.evaluate", {
    expression: `(() => {
      const banner = document.querySelector('[role=\"alert\"], .text-rose-500, .border-rose-500, .bg-rose-500');
      return banner?.innerText || null;
    })()`,
    returnByValue: true
  });
  console.log(`Second ${i}: error banner =`, errBanner.result?.value);
}

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
