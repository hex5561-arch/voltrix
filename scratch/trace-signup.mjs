import { spawn } from "node:child_process";

const CDP_PORT = 9232;
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
  if (!p.request.url.includes(".js") && !p.request.url.includes(".css")) {
    console.log("NET REQ:", p.request.method, p.request.url);
  }
});
pageCdp.on("Network.responseReceived", (p) => {
  if (!p.response.url.includes(".js") && !p.response.url.includes(".css")) {
    console.log("NET RES:", p.response.status, p.response.url);
  }
});
pageCdp.on("Runtime.consoleAPICalled", (p) => {
  console.log("CONSOLE:", p.type, p.args?.map(a => a.value || a.description).join(" "));
});

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

// Use native input setters so React state updates
await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    function setNativeValue(element, value) {
      const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
      const prototype = Object.getPrototypeOf(element);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
      } else if (valueSetter) {
        valueSetter.call(element, value);
      } else {
        element.value = value;
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const inputs = Array.from(document.querySelectorAll('input'));
    const userInput = inputs.find(i => i.placeholder?.includes('username'));
    const passInput = inputs.find(i => i.placeholder?.includes('At least 8'));
    const confInput = inputs.find(i => i.placeholder?.includes('Re-type'));
    const nameInput = inputs.find(i => i.placeholder?.includes('Jane Doe') || i.placeholder?.includes('Full Name'));
    
    const uname = 'scholar_' + Math.floor(Math.random() * 89999 + 10000);
    setNativeValue(nameInput, 'Scholar Alice');
    setNativeValue(userInput, uname);
    setNativeValue(passInput, 'Password123!');
    setNativeValue(confInput, 'Password123!');
    console.log("Values set for:", uname);
  })()`
});

await new Promise(r => setTimeout(r, 800));

// Click submit button
await pageCdp.send("Runtime.evaluate", {
  expression: `(() => {
    const form = document.querySelector('form');
    const submitBtn = form?.querySelector('button[type=\"submit\"]');
    console.log("Submitting form, button:", submitBtn?.innerText, "disabled:", submitBtn?.disabled);
    submitBtn?.click();
  })()`
});

for (let i = 0; i < 10; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const info = await pageCdp.send("Runtime.evaluate", {
    expression: `({
      url: window.location.href,
      token: localStorage.getItem('authToken'),
      alert: document.querySelector('[role=\"alert\"]')?.innerText || null
    })`,
    returnByValue: true
  });
  console.log(`[${i}s]`, info.result.value);
  if (info.result.value.token) break;
}

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
