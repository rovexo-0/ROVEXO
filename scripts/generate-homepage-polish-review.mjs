/**
 * Generates owner-review-screenshots/homepage-polish/index.html
 */
import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const outDir = join(root, "owner-review-screenshots", "homepage-polish");
const indexPath = join(outDir, "index.html");

mkdirSync(outDir, { recursive: true });

const shots = existsSync(outDir)
  ? readdirSync(outDir).filter((f) => f.endsWith(".png")).sort()
  : [];

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ROVEXO v1.0 — Homepage Premium Polish Review</title>
<style>
:root{--bg:#f7f9fc;--surface:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0;--accent:#2563eb}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--text)}
header{padding:2rem 1.5rem;background:linear-gradient(135deg,#2563eb,#1d4ed8 55%,#0f172a);color:#fff}
header h1{margin:0 0 .5rem}main{padding:1.5rem;max-width:1200px;margin:0 auto}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1rem;margin-bottom:1rem}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
figure{margin:0}img{width:100%;border-radius:12px;border:1px solid var(--border)}
figcaption{margin-top:.5rem;font-size:.85rem;color:var(--muted)}
.compare{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
@media(max-width:720px){.compare{grid-template-columns:1fr}}
</style></head><body>
<header>
<h1>ROVEXO v1.0 — Homepage Premium Polish</h1>
<p>After captures · Light mode · Desktop + Mobile · Awaiting owner <strong>APPROVED</strong></p>
<p style="font-family:ui-monospace,monospace;font-size:.85rem;margin-top:1rem">${indexPath.replace(/\\/g, "/")}</p>
</header>
<main>
<section class="panel"><h2>Before vs After</h2>
<div class="compare">
<div><h3>Before</h3><p>Compact 188px hero, flat category tiles, no benefits rail, tall empty states.</p></div>
<div><h3>After</h3><p>260px split hero with 3D visuals, premium category rail, benefits row, compact cards.</p></div>
</div></section>
<section class="panel"><h2>Captures (${shots.length})</h2><div class="grid">
${shots.map((file) => `<figure><a href="${file}"><img src="${file}" alt="${file}" loading="lazy"/></a><figcaption>${file}</figcaption></figure>`).join("")}
</div></section>
</main></body></html>`;

writeFileSync(indexPath, html, "utf8");
console.log("OK", shots.length, "screenshots");
console.log("INDEX", indexPath);
