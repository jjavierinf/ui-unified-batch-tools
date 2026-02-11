import puppeteer from "puppeteer";

async function capture() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
  // Click Data Engineer login
  const btns = await page.$$("button");
  if (btns.length > 0) await btns[0].click();
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: "public/screenshots/10-branch-indicator.png" });
  console.log("saved 10-branch-indicator.png");
  await browser.close();
}

capture().catch(console.error);
