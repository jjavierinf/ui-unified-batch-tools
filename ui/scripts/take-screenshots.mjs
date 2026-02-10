import puppeteer from "puppeteer";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = "http://localhost:3000";
const OUT = "public/screenshots";
const STORE_KEY = "editor-store-v2";

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  // ── Step 0: Load the page and get the hydrated default state ──
  await page.goto(`${BASE}/editor`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(3000);

  // Force store to persist by toggling dark mode and back
  await page.evaluate(() => {
    // Trigger a click on the dark mode toggle to force state save
    const btn = document.querySelector('[aria-label="Toggle dark mode"]')
      || Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg'));
    if (btn) btn.click();
  });
  await sleep(500);
  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Toggle dark mode"]')
      || Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg'));
    if (btn) btn.click();
  });
  await sleep(500);

  // Now grab the persisted state as our template
  const baseState = await page.evaluate((key) => localStorage.getItem(key), STORE_KEY);
  if (!baseState) {
    console.error("ERROR: Could not get base state from localStorage. Key:", STORE_KEY);
    // Try to find the actual key
    const keys = await page.evaluate(() => Object.keys(localStorage));
    console.error("Available keys:", keys);
    await browser.close();
    process.exit(1);
  }
  console.log("Base state captured from localStorage.\n");

  // Helper: modify state, navigate, wait, screenshot
  async function snap(url, name, mutate) {
    // Read current state, apply mutations, write back
    if (mutate) {
      await page.evaluate((key, mutateFn) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const data = JSON.parse(raw);
        // Apply the mutation function (passed as string, eval'd)
        const fn = new Function("s", mutateFn);
        fn(data.state);
        localStorage.setItem(key, JSON.stringify(data));
      }, STORE_KEY, mutate);
    }
    await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(3000);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    console.log(`  ✓ ${name}`);
  }

  console.log("Taking screenshots...\n");

  // ── 1. EDITOR — Dark mode with file tree expanded + file selected ──
  await snap("/editor", "01-editor-dark", `
    s.darkMode = true;
    s.selectedFile = "dags/CRM_integration/AccountReference/sql_files/transformations/data_model_task.sql";
    s.expandedFolders = [
      "dags",
      "dags/CRM_integration",
      "dags/CRM_integration/AccountReference",
      "dags/CRM_integration/AccountReference/sql_files",
      "dags/CRM_integration/AccountReference/sql_files/ddl",
      "dags/CRM_integration/AccountReference/sql_files/transformations",
      "dags/CRM_integration/GameTransaction",
      "dags/CRM_integration/GameTransaction/sql_files",
      "dags/CRM_integration/GameTransaction/sql_files/ddl",
      "dags/CRM_integration/GameTransaction/sql_files/transformations"
    ];
  `);

  // ── 2. EDITOR — Light mode (same file open) ──
  await snap("/editor", "02-editor-light", `
    s.darkMode = false;
  `);

  // ── 3. Quick Open (Cmd+P) ──
  // First set dark mode back
  await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw);
    data.state.darkMode = true;
    localStorage.setItem(key, JSON.stringify(data));
  }, STORE_KEY);
  await page.goto(`${BASE}/editor`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(3000);
  // Trigger Cmd+P
  await page.keyboard.down("Meta");
  await page.keyboard.press("p");
  await page.keyboard.up("Meta");
  await sleep(500);
  await page.keyboard.type("game", { delay: 80 });
  await sleep(500);
  await page.screenshot({ path: `${OUT}/03-quick-open.png` });
  console.log("  ✓ 03-quick-open");
  await page.keyboard.press("Escape");
  await sleep(300);

  // ── 4. Keyboard Shortcuts (Cmd+Shift+/) ──
  await page.keyboard.down("Meta");
  await page.keyboard.down("Shift");
  await page.keyboard.press("/");
  await page.keyboard.up("Shift");
  await page.keyboard.up("Meta");
  await sleep(500);
  await page.screenshot({ path: `${OUT}/04-shortcuts.png` });
  console.log("  ✓ 04-shortcuts");
  await page.keyboard.press("Escape");
  await sleep(300);

  // ── 5. Diff panel — create a visible diff ──
  const diffFile = "dags/CRM_integration/AccountReference/sql_files/transformations/data_model_task.sql";
  await snap("/editor", "05-diff-panel", `
    s.darkMode = true;
    s.diffCollapsed = false;
    const f = s.files["${diffFile}"];
    if (f) {
      f.savedContent = f.content;
      f.content = f.content + "\\n\\n-- New transformation step\\nSELECT\\n    customerID,\\n    lastLoginDateTime,\\n    DATEDIFF(NOW(), lastLoginDateTime) AS days_since_login\\nFROM db_stage.Accounts_dbo_AccountReference\\nWHERE lastLoginDateTime IS NOT NULL;";
      s.selectedFile = "${diffFile}";
    }
    s.expandedFolders = [
      "dags",
      "dags/CRM_integration",
      "dags/CRM_integration/AccountReference",
      "dags/CRM_integration/AccountReference/sql_files",
      "dags/CRM_integration/AccountReference/sql_files/transformations"
    ];
  `);

  // ── 6. Submit flow — Prod mode with approval panel ──
  await snap("/editor", "06-approval-flow", `
    s.darkMode = true;
    s.environment = "prod";
    const f = s.files["${diffFile}"];
    if (f) {
      f.status = "pending_approval";
      f.submittedAt = new Date().toISOString();
      f.savedContent = f.content;
      s.selectedFile = "${diffFile}";
    }
    s.expandedFolders = [
      "dags",
      "dags/CRM_integration",
      "dags/CRM_integration/AccountReference",
      "dags/CRM_integration/AccountReference/sql_files",
      "dags/CRM_integration/AccountReference/sql_files/transformations"
    ];
  `);

  // ── Reset editor state for pipeline screenshots ──
  await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw);
    data.state.environment = "dev";
    data.state.darkMode = true;
    Object.values(data.state.files).forEach(f => { f.status = "draft"; });
    localStorage.setItem(key, JSON.stringify(data));
  }, STORE_KEY);

  // ── 7. Pipeline overview — Dark ──
  await snap("/pipelines", "07-pipeline-overview", `
    s.darkMode = true;
  `);

  // ── 8. Pipeline detail — click first pipeline ──
  await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw);
    data.state.darkMode = true;
    localStorage.setItem(key, JSON.stringify(data));
  }, STORE_KEY);
  await page.goto(`${BASE}/pipelines`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(3000);

  // Find and click a pipeline row
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const pipelineBtn = buttons.find(b => b.textContent && b.textContent.includes('dbo_AccountReference'));
    if (pipelineBtn) {
      pipelineBtn.click();
      return true;
    }
    return false;
  });

  if (clicked) {
    await sleep(2000);
    await page.screenshot({ path: `${OUT}/08-pipeline-detail.png` });
    console.log("  ✓ 08-pipeline-detail");
  } else {
    console.log("  ✗ 08-pipeline-detail (no pipeline row found)");
    // Debug: log available buttons
    const btnTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).map(b => b.textContent?.substring(0, 60))
    );
    console.log("  Available buttons:", btnTexts);
  }

  // ── 9. Pipeline overview — Light mode ──
  await snap("/pipelines", "09-pipeline-light", `
    s.darkMode = false;
  `);

  await browser.close();
  console.log("\nDone! Screenshots saved to " + OUT + "/");
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
