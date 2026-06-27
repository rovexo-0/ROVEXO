/**
 * Generates owner-review-screenshots/homepage-final/index.html
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const outDir = join(root, "owner-review-screenshots", "homepage-final");
const manifestPath = join(outDir, "manifest.json");
const indexPath = join(outDir, "index.html");

if (!existsSync(manifestPath)) {
  console.error("ERROR: manifest.json not found — run owner-review-homepage-final.spec.ts first");
  process.exit(1);
}

/** @type {Array<{file:string;id:string;label:string;device:string;deviceLabel:string;theme:string}>} */
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const missing = manifest.filter((entry) => !existsSync(join(outDir, entry.file)));
if (missing.length > 0) {
  console.error("ERROR: Missing PNG files:", missing.length);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const sections = [...new Set(manifest.map((m) => m.id))];

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ROVEXO v1.0 — Homepage Final Review</title>
<style>
:root{--bg:#f8fafc;--surface:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--text)}
header{padding:2rem 1.5rem;background:linear-gradient(135deg,#2563eb,#4338ca 55%,#7c3aed);color:#fff}
header h1{margin:0 0 .5rem;font-size:clamp(1.5rem,3vw,2rem)}
main{padding:1.5rem;max-width:1400px;margin:0 auto}
section{margin-bottom:2rem}h2{font-size:1.2rem;margin:0 0 1rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden}
.card img{width:100%;display:block;background:#e2e8f0}
.card figcaption{padding:.65rem .75rem;font-size:.8rem}.card figcaption span{color:var(--muted);display:block}
</style></head><body>
<header><h1>ROVEXO v1.0 — Homepage Final Review</h1>
<p>${manifest.length} light-mode screenshots · Awaiting owner <strong>APPROVED</strong></p></header>
<main>
${sections
  .map((sectionId) => {
    const label = manifest.find((m) => m.id === sectionId)?.label ?? sectionId;
    const items = manifest.filter((m) => m.id === sectionId);
    return `<section><h2>${label}</h2><div class="grid">${items
      .map(
        (item) => `
    <figure class="card"><a href="${item.file}"><img src="${item.file}" alt="${item.label} ${item.deviceLabel}" loading="lazy"/></a>
    <figcaption><strong>${item.deviceLabel}</strong><span>Light mode</span></figcaption></figure>`,
      )
      .join("")}</div></section>`;
  })
  .join("")}
</main></body></html>`;

writeFileSync(indexPath, html, "utf8");
console.log("OK", manifest.length, "homepage-final PNGs");
console.log("INDEX", indexPath);
