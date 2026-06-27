/**
 * Generates owner-review-screenshots/phase1/index.html
 */
import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const outDir = join(root, "owner-review-screenshots", "phase1");
const pagesDir = join(outDir, "pages");
const indexPath = join(outDir, "index.html");

mkdirSync(pagesDir, { recursive: true });

const shots = existsSync(pagesDir)
  ? readdirSync(pagesDir).filter((f) => f.endsWith(".png")).sort()
  : [];

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ROVEXO v1.0 — Phase 1 Premium Polish Review</title>
<style>
:root{--bg:#f7f9fc;--surface:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--text)}
header{padding:2rem 1.5rem;background:linear-gradient(135deg,#2563eb,#4338ca 50%,#7c3aed);color:#fff}
header h1{margin:0 0 .5rem}main{padding:1.5rem;max-width:1400px;margin:0 auto}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1rem;margin-bottom:1rem}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
figure{margin:0}img{width:100%;border-radius:12px;border:1px solid var(--border)}
figcaption{margin-top:.5rem;font-size:.8rem;color:var(--muted)}
</style></head><body>
<header><h1>ROVEXO v1.0 — Phase 1 Premium Polish</h1>
<p>${shots.length} captures · Desktop + iPhone · Light + Dark · Awaiting <strong>APPROVED</strong></p>
<p style="font-family:ui-monospace;font-size:.85rem;margin-top:1rem">${indexPath.replace(/\\/g, "/")}</p>
</header><main>
<section class="panel"><h2>Before vs After</h2>
<p><strong>Before:</strong> Compact hero, 5-item benefits rail, tall hub cards.</p>
<p><strong>After:</strong> 1200×280 hero slider, 4 promo cards, 56px dashboard rows, compact category tiles.</p>
</section>
<section class="panel"><h2>Captures</h2><div class="grid">
${shots.map((f) => `<figure><a href="pages/${f}"><img src="pages/${f}" alt="${f}" loading="lazy"/></a><figcaption>${f}</figcaption></figure>`).join("")}
</div></section></main></body></html>`;

writeFileSync(indexPath, html, "utf8");
writeFileSync(
  join(outDir, "PHASE1_REVIEW.md"),
  `# ROVEXO Phase 1 Premium Polish\n\nScreenshots: ${shots.length}\n\nGallery: owner-review-screenshots/phase1/index.html\n\nAwaiting owner APPROVED.\n`,
  "utf8",
);

console.log("OK", shots.length, "phase1 PNGs");
console.log("INDEX", indexPath);
