import puppeteer from "puppeteer";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function mdToHtml(md, baseDir) {
  const lines = md.split(/\r?\n/);
  let html = "";
  let inList = false;
  let inCode = false;
  let codeBuf = [];

  const flushList = () => {
    if (!inList) return;
    html += "</ul>\n";
    inList = false;
  };

  const flushCode = () => {
    if (!inCode) return;
    const code = escapeHtml(codeBuf.join("\n"));
    html += `<pre><code>${code}</code></pre>\n`;
    inCode = false;
    codeBuf = [];
  };

  for (const raw of lines) {
    const line = raw ?? "";

    if (line.startsWith("```")) {
      if (inCode) {
        flushCode();
      } else {
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (/^#\s+/.test(line)) {
      flushList();
      html += `<h1>${escapeHtml(line.replace(/^#\s+/, ""))}</h1>\n`;
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushList();
      html += `<h2>${escapeHtml(line.replace(/^##\s+/, ""))}</h2>\n`;
      continue;
    }
    if (/^###\s+/.test(line)) {
      flushList();
      html += `<h3>${escapeHtml(line.replace(/^###\s+/, ""))}</h3>\n`;
      continue;
    }

    const imgMatch = line.match(/^!\[(.*)\]\((.*)\)\s*$/);
    if (imgMatch) {
      flushList();
      const alt = escapeHtml(imgMatch[1] ?? "");
      const rel = imgMatch[2] ?? "";
      const abs = path.resolve(baseDir, rel);
      const src = `file://${abs}`;
      html += `<div class="img"><img alt="${alt}" src="${src}" /></div>\n`;
      continue;
    }

    const liMatch = line.match(/^\-\s+(.*)$/);
    if (liMatch) {
      if (!inList) {
        html += "<ul>\n";
        inList = true;
      }
      html += `<li>${escapeHtml(liMatch[1] ?? "")}</li>\n`;
      continue;
    }

    if (line.trim() === "") {
      flushList();
      html += "\n";
      continue;
    }

    flushList();
    html += `<p>${escapeHtml(line)}</p>\n`;
  }

  flushList();
  flushCode();

  return html;
}

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error("Usage: node ui/scripts/render-md-to-pdf.mjs <input.md> <output.pdf>");
    process.exit(2);
  }

  const mdPath = path.resolve(process.cwd(), input);
  const outPath = path.resolve(process.cwd(), output);
  const baseDir = path.dirname(mdPath);

  const md = await readFile(mdPath, "utf-8");
  const body = mdToHtml(md, baseDir);

  const doc = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(path.basename(mdPath))}</title>
  <style>
    :root { color-scheme: light; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      line-height: 1.35;
      color: #111827;
      margin: 0;
      padding: 28px 32px;
      font-size: 12px;
    }
    h1 { font-size: 20px; margin: 0 0 10px; }
    h2 { font-size: 16px; margin: 18px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    h3 { font-size: 13px; margin: 14px 0 6px; }
    p { margin: 6px 0; color: #111827; }
    ul { margin: 6px 0 10px 18px; padding: 0; }
    li { margin: 3px 0; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 11px; }
    pre { background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px; overflow: auto; border-radius: 8px; }
    .img { margin: 10px 0 8px; }
    img { max-width: 100%; border: 1px solid #e5e7eb; border-radius: 10px; }
  </style>
</head>
<body>
${body}
</body>
</html>`;

  await mkdir(path.dirname(outPath), { recursive: true });
  const tmpHtml = path.join(os.tmpdir(), `changelog-${Date.now()}.html`);
  await writeFile(tmpHtml, doc, "utf-8");

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(`file://${tmpHtml}`, { waitUntil: "load" });
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", right: "12mm", bottom: "14mm", left: "12mm" },
  });
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

