import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const SCREENSHOTS_DIR = "/home/voltrix/voltrix-os/cloudflare-os/screenshots/mobile_ui";
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CDP_PORT = 9261;
const chromeProc = spawn("/usr/bin/chromium", [
  "--headless=new",
  `--remote-debugging-port=${CDP_PORT}`,
  "--window-size=393,852",
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

async function evalCode(expression) {
  return await pageCdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
  });
}

async function captureScreenshot(filename) {
  const { data } = await pageCdp.send("Page.captureScreenshot", { format: "png" });
  const outPath = path.join(SCREENSHOTS_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
  console.log(`Saved screenshot: ${outPath} (${Buffer.from(data, "base64").length} bytes)`);
  return outPath;
}

try {
  console.log("Navigating to voltrix.stream...");
  await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
  await new Promise(r => setTimeout(r, 1500));

  await evalCode(`localStorage.setItem('authToken', 'emma:CtbvtNoBaRh/vMWZOiOEXK1CIkACMamwxtY9R0pzXEY=')`);
  
  console.log("Navigating to workspace...");
  await pageCdp.send("Page.navigate", { url: "https://voltrix.stream/workspace/1c0696dd85484f55e4932012f5f050d5fd2f6b599dcf57b68d39f426667cc1e5" });

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const txt = (await evalCode("document.body.innerText")).result.value || "";
    if (txt.includes("Initial Greeting Message")) {
      console.log(`Loaded workspace at sec ${i}`);
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));

  // 1. Mobile conversation list view
  await captureScreenshot("01-mobile-conversations-list.png");

  // 2. Open Academic Tools dropdown from conversation list header
  console.log("Opening Academic Tools dropdown...");
  await evalCode(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const academicBtn = btns.find(b => b.getAttribute('aria-label') === 'Academic Tools' || b.getAttribute('title')?.includes('Academic Tools') || b.querySelector('svg.text-emerald-500'));
    if (academicBtn) academicBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await captureScreenshot("02-mobile-academic-tools-dropdown.png");

  // Close dropdown
  await evalCode(`document.body.click()`);
  await new Promise(r => setTimeout(r, 500));

  // 3. Click into Calculus Explained YouTube Video conversation
  console.log("Entering Calculus conversation...");
  await evalCode(`(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const item = all.find(el => el.innerText?.trim() === 'Calculus Explained YouTube Video' && el.children.length === 0);
    if (item) {
      item.click();
    } else {
      const anyItem = all.find(el => el.innerText?.includes('Calculus Explained YouTube Video'));
      if (anyItem) anyItem.click();
    }
  })()`);

  // Wait for conversation to load
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const inChat = (await evalCode("Boolean(document.querySelector('textarea, input[placeholder*=\"Reply\"], input[placeholder*=\"Ask\"]'))")).result.value;
    if (inChat) {
      console.log(`Entered chat thread at sec ${i}`);
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await captureScreenshot("03-mobile-chat-thread.png");

  // 4. Open Academic Tools inside chat thread
  console.log("Opening Academic Tools inside chat thread...");
  await evalCode(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const academicBtn = btns.find(b => b.getAttribute('aria-label') === 'Academic Tools' || b.getAttribute('title')?.includes('Academic Tools') || b.querySelector('svg.text-emerald-500'));
    if (academicBtn) academicBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));
  await captureScreenshot("04-mobile-chat-academic-dropdown.png");

  // Close dropdown
  await evalCode(`document.body.click()`);
  await new Promise(r => setTimeout(r, 500));

  // 5. Click the [ Gadget ] button on the chat card
  console.log("Clicking [ Gadget ] button on card...");
  const clickedGadget = (await evalCode(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const gadgetBtn = btns.find(b => b.innerText?.includes('Gadget') || b.innerText?.includes('⚡ Gadget') || b.innerText?.includes('View Gadget') || b.getAttribute('title')?.includes('Gadget'));
    if (gadgetBtn) {
      gadgetBtn.click();
      return true;
    }
    return false;
  })()`)).result.value;
  console.log("Clicked gadget button:", clickedGadget);

  await new Promise(r => setTimeout(r, 2000));
  await captureScreenshot("05-mobile-gadget-ui-view.png");

  // 6. Switch to Code tab in minimalist pill
  console.log("Switching to Code tab in minimalist pill...");
  const clickedCode = (await evalCode(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const codeBtn = btns.find(b => (b.innerText?.trim() === 'Code' || b.innerText?.includes('Code')) && b.closest('.bg-kumo-subtle, .rounded-full'));
    if (codeBtn) {
      codeBtn.click();
      return true;
    }
    const anyCodeBtn = btns.find(b => b.innerText?.trim() === 'Code');
    if (anyCodeBtn) {
      anyCodeBtn.click();
      return true;
    }
    return false;
  })()`)).result.value;
  console.log("Clicked code pill button:", clickedCode);

  await new Promise(r => setTimeout(r, 2000));
  await captureScreenshot("06-mobile-code-view.png");

  // 7. Click back to chat
  console.log("Clicking Back to Chat...");
  await evalCode(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const backBtn = btns.find(b => b.innerText?.includes('Chat') || b.getAttribute('aria-label')?.includes('Back') || b.querySelector('svg.lucide-chevron-left, svg.lucide-caret-left'));
    if (backBtn) backBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1500));
  await captureScreenshot("07-mobile-back-to-chat.png");

  console.log("Completed all captures successfully!");
} catch (err) {
  console.error("Error during screenshot capture:", err);
} finally {
  chromeProc.kill();
  process.exit(0);
}
