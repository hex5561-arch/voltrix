import { spawn } from "node:child_process";
import fs from "node:fs";

const SCREENSHOTS_DIR = "/home/voltrix/voltrix-os/cloudflare-os/screenshots/live_edge";
const CDP_PORT = 9248;
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
  fs.writeFileSync(`${SCREENSHOTS_DIR}/${filename}`, Buffer.from(data, "base64"));
  console.log(`Saved screenshot: ${filename}`);
}

await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
await new Promise(r => setTimeout(r, 1500));
await evalCode(`localStorage.setItem('authToken', 'emma:CtbvtNoBaRh/vMWZOiOEXK1CIkACMamwxtY9R0pzXEY=')`);
await pageCdp.send("Page.navigate", { url: "https://voltrix.stream/workspace/1c0696dd85484f55e4932012f5f050d5fd2f6b599dcf57b68d39f426667cc1e5" });

// Wait until ChatInterface renders actual messages
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const hasMessages = (await evalCode("document.querySelectorAll('.prose, p, div').length > 15")).result.value;
  const isSpinnerDone = (await evalCode("!document.body.innerText.includes('Loading conversation...')")).result.value;
  console.log(`Wait check [${i}s]: hasMessages=${hasMessages}, isSpinnerDone=${isSpinnerDone}`);
  if (hasMessages && isSpinnerDone) break;
}

await new Promise(r => setTimeout(r, 2000));

// 1. Capture Chat view with active Top Segmented Switcher Pill Bar
await captureScreenshot("edge-final-01-chat-with-switcher.png");

// 2. Click "⚡ Gadget UI" pill
console.log("Clicking '⚡ Gadget UI' pill...");
const clickGadget = await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const pill = btns.find(b => b.innerText.includes('Gadget UI'));
  if (pill) {
    pill.click();
    return "Clicked Gadget UI pill";
  }
  return "Not found";
})()`);
console.log(clickGadget.result.value);

await new Promise(r => setTimeout(r, 3000));

// Check visibility and dimensions of right pane
const rightPaneInfo = await evalCode(`(() => {
  const iframes = Array.from(document.querySelectorAll('iframe'));
  return {
    iframeCount: iframes.length,
    iframes: iframes.map(f => ({
      title: f.title,
      w: f.offsetWidth,
      h: f.offsetHeight,
      display: window.getComputedStyle(f).display
    }))
  };
})()`);
console.log("Right pane info:", rightPaneInfo.result.value);

// 3. Capture full mobile Gadget UI view
await captureScreenshot("edge-final-02-gadget-ui-view.png");

// 4. Click "💬 Chat" pill to switch back
console.log("Clicking '💬 Chat' pill...");
const clickChat = await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const pill = btns.find(b => b.innerText.includes('Chat'));
  if (pill) {
    pill.click();
    return "Clicked Chat pill";
  }
  return "Not found";
})()`);
console.log(clickChat.result.value);

await new Promise(r => setTimeout(r, 1500));

// 5. Capture Chat view back
await captureScreenshot("edge-final-03-back-to-chat.png");

console.log("All screenshots captured cleanly!");

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
