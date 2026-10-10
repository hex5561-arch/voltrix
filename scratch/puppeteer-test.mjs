import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/chromium",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

page.on("console", msg => console.log("BROWSER LOG:", msg.text()));
page.on("pageerror", err => console.error("BROWSER ERROR:", err.message));

console.log("Navigating to https://voltrix.stream ...");
await page.goto("https://voltrix.stream", { waitUntil: "networkidle2", timeout: 30000 });

console.log("Current URL:", page.url());
console.log("Title:", await page.title());

const buttons = await page.$$eval("button", els => els.map(e => e.innerText.trim()).filter(Boolean));
console.log("Buttons found:", buttons);

// Click "Demos"
const demoBtn = (await page.$$("button")).find(async b => {
  const t = await b.evaluate(el => el.innerText);
  return t.includes("Demos");
});
// Let's use evaluate to click Demos
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const d = btns.find(b => b.innerText.includes('Demos'));
  if (d) d.click();
});
await new Promise(r => setTimeout(r, 1000));

const demoLaunchers = await page.$$eval("button", els => els.map(e => e.innerText.trim()).filter(Boolean));
console.log("Buttons after Demos click:", demoLaunchers);

// Click the first "Launch" button
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const l = btns.find(b => b.innerText.includes('Launch'));
  if (l) l.click();
});

console.log("Clicked Launch! Waiting for navigation or token...");
for (let i = 0; i < 15; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const url = page.url();
  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  console.log(`[${i}s] URL: ${url}, Token: ${token ? 'YES' : 'NO'}`);
  if (url.includes('/workspace/')) break;
}

await page.screenshot({ path: "/home/voltrix/voltrix-os/cloudflare-os/screenshots/live_edge/puppeteer-step1.png" });
console.log("Screenshot saved!");

await browser.close();
