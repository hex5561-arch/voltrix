import { spawn } from "node:child_process";
import fs from "node:fs";

const SCREENSHOTS_DIR = "/home/voltrix/screenshots";
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CDP_PORT = 9260;
const chromeProc = spawn("/usr/bin/chromium", [
  "--headless=new",
  `--remote-debugging-port=${CDP_PORT}`,
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--host-resolver-rules=MAP voltrix.stream 104.21.40.38",
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

if (!cdpWsUrl) {
  console.error("Failed to connect to Chromium CDP");
  chromeProc.kill("SIGKILL");
  process.exit(1);
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
  width: 1280,
  height: 800,
  deviceScaleFactor: 1,
  mobile: false,
  screenOrientation: { angle: 0, type: "landscapePrimary" },
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
  console.log(`Saved screenshot: ${SCREENSHOTS_DIR}/${filename}`);
}

try {
  console.log("Setting auth token on voltrix.stream...");
  await pageCdp.send("Page.navigate", { url: "https://voltrix.stream" });
  await new Promise((r) => setTimeout(r, 2000));
  await evalCode(`localStorage.setItem('authToken', 'emma:CtbvtNoBaRh/vMWZOiOEXK1CIkACMamwxtY9R0pzXEY=')`);

  console.log("Navigating to https://voltrix.stream/vtube...");
  await pageCdp.send("Page.navigate", { url: "https://voltrix.stream/vtube" });
  await new Promise((r) => setTimeout(r, 4000));

  // Verify V-Tube page rendered
  const pageState = await evalCode(`({
    title: document.title,
    heading: document.querySelector('h1')?.innerText,
    hasConnectBtn: Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Connect YouTube')),
    cardCount: document.querySelectorAll('a[href^="/vtube/"]').length
  })`);
  console.log("Feed Page State:", pageState.result.value);
  await captureScreenshot("vtube-01-dashboard.png");

  // Click "Connect YouTube" button
  console.log("Clicking 'Connect YouTube'...");
  await evalCode(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Connect YouTube'));
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1200));

  // Check if Modal is visible
  const modalState = await evalCode(`({
    hasModal: !!document.querySelector('.fixed.inset-0'),
    modalText: document.querySelector('.fixed.inset-0 h2')?.innerText,
    hasOAuthBtn: Array.from(document.querySelectorAll('.fixed.inset-0 button')).some(b => b.innerText.includes('Authorize with Google'))
  })`);
  console.log("Modal State:", modalState.result.value);
  await captureScreenshot("vtube-02-connect-modal.png");

  // Close modal
  await evalCode(`(() => {
    const closeBtn = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(b => b.innerText.includes('Keep in Voltrix') || b.innerText.includes('Close') || b.querySelector('svg'));
    if (closeBtn) closeBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  // Navigate to Theater watch page
  console.log("Navigating to https://voltrix.stream/vtube/fNk_zzaMoSs...");
  await pageCdp.send("Page.navigate", { url: "https://voltrix.stream/vtube/fNk_zzaMoSs" });
  await new Promise((r) => setTimeout(r, 3500));

  const theaterState = await evalCode(`({
    title: document.title,
    heading: document.querySelector('h1')?.innerText,
    author: document.querySelector('.text-kumo-brand')?.innerText,
    hasLikeBtn: Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Like') || b.innerText.includes('Liked')),
    hasSubBtn: Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Subscribe') || b.innerText.includes('Subscribed')),
    hasConnectBtn: Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Connect YouTube'))
  })`);
  console.log("Theater Page State:", theaterState.result.value);
  await captureScreenshot("vtube-03-theater.png");

  console.log("All V-Tube verification steps completed successfully!");
} catch (err) {
  console.error("Error during verification:", err);
} finally {
  try {
    pageCdp.ws.close();
    cdp.ws.close();
  } catch {}
  chromeProc.kill("SIGKILL");
}
