import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const SCREENSHOTS_DIR = "/home/voltrix/voltrix-os/cloudflare-os/screenshots/live_edge";
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CDP_PORT = 9238;
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

// Emulate iPhone (Mobile view 390x844)
await pageCdp.send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
  screenOrientation: { angle: 0, type: "portraitPrimary" },
});
await pageCdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await pageCdp.send("Page.enable");
await pageCdp.send("Runtime.enable");

const errorsDetected = [];
pageCdp.on("Runtime.exceptionThrown", (params) => {
  const desc = params.exceptionDetails?.exception?.description || params.exceptionDetails?.text;
  console.error("PAGE EXCEPTION:", desc);
  errorsDetected.push(desc);
});
pageCdp.on("Runtime.consoleAPICalled", (params) => {
  if (params.type === "error") {
    const text = params.args.map((a) => a.value || a.description).join(" ");
    console.error("CONSOLE ERROR:", text);
    if (!text.includes("favicon")) errorsDetected.push(text);
  }
});

async function captureScreenshot(filename) {
  const { data } = await pageCdp.send("Page.captureScreenshot", { format: "png" });
  const outPath = path.join(SCREENSHOTS_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
  console.log(`Saved screenshot: ${filename}`);
}

async function evalCode(expression) {
  return await pageCdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
  });
}

console.log("Navigating to https://voltrix.stream ...");
await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });

// Wait for initial load
for (let i = 0; i < 15; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const count = (await evalCode("document.querySelectorAll('button').length")).result.value;
  if (count > 0) break;
}

// Click Demos
await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const d = btns.find(b => b.innerText.includes('Demos'));
  if (d) d.click();
})()`);
await new Promise(r => setTimeout(r, 800));

// Click Emma launch
await evalCode(`(() => {
  const cards = Array.from(document.querySelectorAll('.rounded-2xl'));
  const emmaCard = cards.find(c => c.innerText.includes('Emma'));
  if (emmaCard) {
    const btn = emmaCard.querySelector('button');
    if (btn) btn.click();
  }
})()`);
await new Promise(r => setTimeout(r, 2500));

// Click on existing "Calculus Video Finder" workspace link to enter workspace with existing apps/videos!
console.log("Navigating into Calculus Video Finder workspace...");
const clickWorkspaceRes = await evalCode(`(() => {
  const links = Array.from(document.querySelectorAll('a'));
  const calcLink = links.find(a => a.href.includes('/workspace/') && a.innerText.includes('Calculus'));
  if (calcLink) {
    calcLink.click();
    return "Clicked Calculus workspace";
  }
  const anyWs = links.find(a => a.href.includes('/workspace/'));
  if (anyWs) {
    anyWs.click();
    return "Clicked workspace " + anyWs.href;
  }
  return "No workspace link found";
})()`);
console.log("Workspace navigation:", clickWorkspaceRes.result.value);

for (let i = 0; i < 15; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const url = (await evalCode("window.location.href")).result.value;
  if (url.includes("/workspace/")) {
    console.log(`Entered workspace [${i}s]:`, url);
    break;
  }
}

// Wait for workspace to hydrate
await new Promise(r => setTimeout(r, 4000));

// Step 1: Capture Chat view with Top Segmented Switcher Pill Bar
await captureScreenshot("edge-09-mobile-workspace-loaded.png");

// Inspect buttons on screen
const pillCheck = await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
  const hasChat = btns.some(t => t.includes('Chat'));
  const hasGadget = btns.some(t => t.includes('Gadget UI'));
  return { hasChat, hasGadget, btns };
})()`);
console.log("Segmented Pill Bar Check in Workspace:", pillCheck.result.value);

// Send message to agent to search for a video or pull YouTube video
console.log("Sending chat message asking agent for video...");
await evalCode(`(() => {
  const ta = document.querySelector('textarea');
  if (ta) {
    ta.value = "pull me a video from youtube explaining 3blue1brown essence of calculus";
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
})()`);
await new Promise(r => setTimeout(r, 500));

await evalCode(`(() => {
  const form = document.querySelector('form');
  const btn = form?.querySelector('button[type=\"submit\"]') || form?.querySelector('button:last-child');
  if (btn) btn.click();
})()`);

await captureScreenshot("edge-10-message-sent-in-workspace.png");

// Wait for agent to respond with video card in chat
console.log("Waiting for agent response and video card in chat...");
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const cardFound = (await evalCode(`(() => {
    return !!document.querySelector('iframe, [title*=\"Play\"], [title*=\"Gadget\"], .border-amber-500, svg');
  })()`)).result.value;
  if (i % 5 === 0) console.log(`Waiting... [${i}s]`);
}

await captureScreenshot("edge-11-agent-response-chat-card.png");

// Switch to Gadget UI via top segmented pill bar
console.log("Clicking 'Gadget UI' pill on top switcher...");
const switchRes = await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const gadgetBtn = btns.find(b => b.innerText.includes('Gadget UI'));
  if (gadgetBtn) {
    gadgetBtn.click();
    return "Clicked Gadget UI pill";
  }
  return "Could not find Gadget UI pill";
})()`);
console.log("Switch result:", switchRes.result.value);

await new Promise(r => setTimeout(r, 3000));
await captureScreenshot("edge-12-gadget-ui-view.png");

// Switch back to Chat via top segmented pill bar
console.log("Clicking 'Chat' pill to switch back...");
const backRes = await evalCode(`(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const chatBtn = btns.find(b => b.innerText.includes('Chat'));
  if (chatBtn) {
    chatBtn.click();
    return "Clicked Chat pill";
  }
  return "Could not find Chat pill";
})()`);
console.log("Back result:", backRes.result.value);

await new Promise(r => setTimeout(r, 1500));
await captureScreenshot("edge-13-switched-back-to-chat.png");

console.log("Errors detected throughout flow on Cloudflare Edge:", errorsDetected);

cdp.ws.close();
pageCdp.ws.close();
chromeProc.kill("SIGKILL");
