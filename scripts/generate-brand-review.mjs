/**
 * Generates owner-review-screenshots/brand/index.html
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const outDir = join(root, "owner-review-screenshots", "brand");
const manifestPath = join(outDir, "manifest.json");
const indexPath = join(outDir, "index.html");

if (!existsSync(manifestPath)) {
  console.error("Run e2e/owner-review-brand.spec.ts first");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ROVEXO Brand Review</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a}
header{padding:2rem;background:linear-gradient(135deg,#2563eb,#7c3aed,#ec4899);color:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;padding:1.5rem}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
.card img{width:100%;display:block}
.card figcaption{padding:.75rem;font-size:.85rem}
</style></head><body>
<header><h1>ROVEXO v1.0 — Enterprise Brand Review</h1><p>${manifest.length} screenshots · Awaiting owner APPROVED</p></header>
<div class="grid">${manifest
  .map(
    (item) => `<figure class="card"><img src="${item.file}" alt="${item.kind} ${item.device}" loading="lazy"/><figcaption>${item.kind} · ${item.device}</figcaption></figure>`,
  )
  .join("")}</div></body></html>`;
writeFileSync(indexPath, html, "utf8");
console.log("INDEX", indexPath);
