import puppeteer from "puppeteer";
import { mkdirSync } from "fs";

const SCREENSHOTS_DIR = new URL("../public/screenshots", import.meta.url).pathname;
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const BASE = "http://localhost:3000";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, text, options = {}) {
  const { exact = false, timeout = 3000 } = options;
  const els = await page.$$("*");
  for (const el of els) {
    const t = await el.evaluate((e) => e.textContent?.trim());
    const visible = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (!visible) continue;
    if (exact ? t === text : t?.includes(text)) {
      await el.click();
      return true;
    }
  }
  throw new Error(`Text "${text}" not found`);
}

async function capture() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Clear localStorage for clean state
  await page.goto(BASE, { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForSelector("text/Unified Batch Tools", { timeout: 5000 });

  // 01. Login screen
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-login-screen.png` });
  console.log("01 login screen ✓");

  // Login as Data Engineer (first button in the login card area)
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.includes("Data Engineer")) { b.click(); return; }
    }
    btns[0]?.click();
  });
  await page.waitForSelector("text/SQL Editor", { timeout: 5000 });
  await wait(800);

  // 02. Code Mode empty
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-code-mode-empty.png` });
  console.log("02 code mode empty ✓");

  // Inject selectedFile + expandedFolders into localStorage for reliable file open
  await page.evaluate(() => {
    const editorRaw = localStorage.getItem("editor-store-v2");
    const data = editorRaw ? JSON.parse(editorRaw) : { state: {}, version: 0 };
    data.state.selectedFile = "dags/CRM_integration/AccountReference/sql_files/transformations/data_model_task.sql";
    data.state.expandedFolders = [
      "dags", "dags/CRM_integration", "dags/CRM_integration/AccountReference",
      "dags/CRM_integration/AccountReference/sql_files",
      "dags/CRM_integration/AccountReference/sql_files/transformations"
    ];
    localStorage.setItem("editor-store-v2", JSON.stringify(data));
  });
  await page.reload({ waitUntil: "networkidle2" });
  await wait(2000); // Wait for Monaco + hydration

  // 03. Code Mode with editor + branch indicator
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-code-mode-editor.png` });
  console.log("03 code mode editor ✓");

  await page.click('[title="Pipeline context"]');
  await wait(800);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-code-mode-pipeline-sidebar.png` });
  console.log("04 pipeline sidebar in code mode ✓");

  // Switch to Pipeline Mode via header tab
  await page.evaluate(() => {
    const allBtns = document.querySelectorAll("button");
    for (const btn of allBtns) {
      const text = btn.textContent?.trim();
      const rect = btn.getBoundingClientRect();
      // Header Pipelines tab is at the top (y < 50) and says "Pipelines"
      if (text === "Pipelines" && rect.y < 50) {
        btn.click();
        return;
      }
    }
  });
  await wait(600);

  // 05. Pipeline overview
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-pipeline-overview.png` });
  console.log("05 pipeline overview ✓");

  // Click into pipeline detail
  await page.evaluate(() => {
    const rows = document.querySelectorAll("tr, [class*='cursor-pointer']");
    for (const row of rows) {
      if (row.textContent?.includes("dbo_AccountReference")) { row.click(); return; }
    }
  });
  await wait(600);

  // 06. Pipeline detail — scroll down to show + Add task button
  await page.evaluate(() => {
    const scrollable = document.querySelector('[class*="overflow-y-auto"]');
    if (scrollable) scrollable.scrollTop = 200;
  });
  await wait(300);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-pipeline-detail.png` });
  console.log("06 pipeline detail ✓");

  // Scroll back to top for task interactions
  await page.evaluate(() => {
    const scrollable = document.querySelector('[class*="overflow-y-auto"]');
    if (scrollable) scrollable.scrollTop = 0;
  });
  await wait(300);

  // Click on a task card to open slide-out
  await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="cursor-pointer"]');
    for (const el of els) {
      if (el.textContent?.includes("extract_crm_accounts")) { el.click(); return; }
    }
  });
  await wait(2000); // Wait for Monaco in slide-out

  // 07. SQL slide-out
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-sql-slideout.png` });
  console.log("07 sql slideout ✓");

  // 11. Click Diff button in slide-out footer
  await page.evaluate(() => {
    const allBtns = document.querySelectorAll("button");
    for (const btn of allBtns) {
      if (btn.textContent?.trim() === "Diff") { btn.click(); return; }
    }
  });
  await wait(1500); // Wait for diff editor

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/11-diff-slideout.png` });
  console.log("11 diff in slideout ✓");

  // Close slide-out
  await page.evaluate(() => {
    const btn = document.querySelector('[title="Close"]');
    if (btn) btn.click();
  });
  await wait(400);

  // 12. Click + Add task
  await page.evaluate(() => {
    const scrollable = document.querySelector('[class*="overflow-y-auto"]');
    if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;
  });
  await wait(300);

  await page.evaluate(() => {
    const allBtns = document.querySelectorAll("button");
    for (const btn of allBtns) {
      if (btn.textContent?.includes("Add task")) { btn.click(); return; }
    }
  });
  await wait(400);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/12-add-task.png` });
  console.log("12 add task form ✓");

  // Cancel add task
  await page.evaluate(() => {
    const allBtns = document.querySelectorAll("button");
    for (const btn of allBtns) {
      if (btn.textContent?.trim() === "Cancel") { btn.click(); return; }
    }
  });
  await wait(200);

  // Go back to overview for support button
  await page.evaluate(() => {
    const btn = document.querySelector('[title="Back to overview"]');
    if (btn) btn.click();
  });
  await wait(400);

  // 09. Click support button — use evaluate to bypass Next.js dev toolbar overlap
  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Open support"]');
    if (btn) {
      // Dispatch a React-compatible click event
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }
  });
  await wait(600);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/09-support-modal.png` });
  console.log("09 support modal ✓");

  // Close support modal
  await page.keyboard.press("Escape");
  await wait(300);

  // 08. Toggle dark mode
  await page.evaluate(() => {
    const btn = document.querySelector('[title*="dark mode"], [title*="light mode"], [title*="Switch to"]');
    if (btn) btn.click();
  });
  await wait(500);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-dark-mode.png` });
  console.log("08 dark mode ✓");

  // 10. Go to Code Mode in dark mode to show branch indicator
  await page.evaluate(() => {
    const allBtns = document.querySelectorAll("button");
    for (const btn of allBtns) {
      const text = btn.textContent?.trim();
      const rect = btn.getBoundingClientRect();
      if (text === "SQL Editor" && rect.y < 50) { btn.click(); return; }
    }
  });
  await wait(800);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/10-branch-indicator.png` });
  console.log("10 branch indicator ✓");

  // --- 13. Approval Dashboard (Team Leader) ---

  // Logout (toggle dark mode back first)
  await page.evaluate(() => {
    const btn = document.querySelector('[title*="dark mode"], [title*="light mode"], [title*="Switch to"]');
    if (btn) btn.click();
  });
  await wait(300);

  // Submit a file to prod to create pending_approval state
  await page.evaluate(() => {
    const raw = localStorage.getItem("editor-store-v2");
    if (!raw) return;
    const data = JSON.parse(raw);
    const files = data.state.files;
    // Mark 3 files as pending_approval for screenshot
    const paths = Object.keys(files).slice(0, 3);
    for (const p of paths) {
      files[p].status = "pending_approval";
      files[p].submittedAt = new Date(Date.now() - 3600000).toISOString();
    }
    data.state.files = files;
    localStorage.setItem("editor-store-v2", JSON.stringify(data));
  });

  // Login as Team Leader
  await page.evaluate(() => {
    const raw = localStorage.getItem("auth-store-v1");
    const data = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    data.state.currentUser = { id: "team-leader", name: "Team Leader", role: "leader", avatar: "TL" };
    localStorage.setItem("auth-store-v1", JSON.stringify(data));
    // Set view mode to approvals
    const ws = localStorage.getItem("workspace-store-v1");
    const wsData = ws ? JSON.parse(ws) : { state: {}, version: 0 };
    wsData.state.viewMode = "approvals";
    localStorage.setItem("workspace-store-v1", JSON.stringify(wsData));
  });
  await page.reload({ waitUntil: "networkidle2" });
  await wait(1500);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/13-approval-dashboard.png` });
  console.log("13 approval dashboard ✓");

  await browser.close();
  console.log("\nAll screenshots saved to public/screenshots/");
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
