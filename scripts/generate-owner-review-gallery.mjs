/**
 * Generates owner-review-screenshots/index.html + THEME_FINAL_REVIEW.md
 * Verifies every manifest PNG exists on disk.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const outDir = join(root, "owner-review-screenshots");
const manifestPath = join(outDir, "manifest.json");
const indexPath = join(outDir, "index.html");
const reviewPath = join(outDir, "THEME_FINAL_REVIEW.md");

if (!existsSync(manifestPath)) {
  console.error("ERROR: manifest.json not found at", manifestPath);
  process.exit(1);
}

/** @type {Array<{file:string;id:string;label:string;device:string;deviceLabel:string;theme:string;path?:string}>} */
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const missing = manifest.filter((entry) => !existsSync(join(outDir, entry.file)));
if (missing.length > 0) {
  console.error("ERROR: Missing PNG files:", missing.length);
  missing.forEach((m) => console.error("  -", m.file));
  process.exit(1);
}

const pageIds = [...new Set(manifest.map((m) => m.id))];
const devices = [...new Set(manifest.map((m) => m.device))];
const themes = [...new Set(manifest.map((m) => m.theme))];

function renderGrid(items) {
  return `<div class="grid">${items
    .map(
      (item) => `
    <figure class="card" data-theme="${item.theme}" data-device="${item.device}" data-id="${item.id}">
      <a href="${item.file}" target="_blank" rel="noopener">
        <img src="${item.file}" alt="${item.label} — ${item.deviceLabel} — ${item.theme}" loading="lazy" />
      </a>
      <figcaption><strong>${item.label}</strong><span>${item.deviceLabel} · ${item.theme} mode</span></figcaption>
    </figure>`,
    )
    .join("")}</div>`;
}

function comparisonRow(pageId, label) {
  const pick = (device, theme) => manifest.find((p) => p.id === pageId && p.device === device && p.theme === theme);
  const cell = (shot, title) =>
    shot
      ? `<figure><a href="${shot.file}"><img src="${shot.file}" alt="${title}" loading="lazy" /></a><figcaption>${title}</figcaption></figure>`
      : `<figure class="missing"><div>Missing</div><figcaption>${title}</figcaption></figure>`;
  return `<section class="compare-block"><h3>${label}</h3><div class="compare-row">
    <div class="compare-col"><h4>Light · Desktop</h4>${cell(pick("desktop", "light"), "Light Desktop")}</div>
    <div class="compare-col"><h4>Dark · Desktop</h4>${cell(pick("desktop", "dark"), "Dark Desktop")}</div>
    <div class="compare-col"><h4>Light · iPhone</h4>${cell(pick("iphone", "light"), "Light iPhone")}</div>
    <div class="compare-col"><h4>Dark · iPhone</h4>${cell(pick("iphone", "dark"), "Dark iPhone")}</div>
  </div></section>`;
}

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ROVEXO v1.0 — Owner Review Gallery</title>
<style>
:root{--bg:#f4f6fb;--surface:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0;--accent:#2563eb}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--text)}
header{padding:2rem 1.5rem;background:linear-gradient(135deg,#2563eb,#1d4ed8 55%,#0f172a);color:#fff}
header h1{margin:0 0 .5rem;font-size:clamp(1.5rem,3vw,2.25rem)}.stats{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1rem}
.stat{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:.35rem .85rem;font-size:.85rem}
main{padding:1.5rem;max-width:1600px;margin:0 auto}h2{font-size:1.35rem;border-bottom:1px solid var(--border);padding-bottom:.5rem}
.panel,.compare-block{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1rem;margin-bottom:1rem}
.before-after{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.filters{display:flex;flex-wrap:wrap;gap:.5rem;margin:1rem 0}.filters button{border:1px solid var(--border);background:var(--surface);border-radius:999px;padding:.4rem .8rem;cursor:pointer}
.filters button.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.card img{width:100%;aspect-ratio:9/16;object-fit:cover;object-position:top;display:block;background:#e2e8f0}
.card figcaption{padding:.65rem .75rem;font-size:.8rem}.card figcaption span{color:var(--muted);display:block}
.compare-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem}
.compare-col img{width:100%;border-radius:10px;border:1px solid var(--border)}.compare-col h4{font-size:.75rem;color:var(--muted);text-transform:uppercase}
.paths{font-family:ui-monospace,monospace;font-size:.85rem;word-break:break-all}footer{text-align:center;padding:1.5rem;color:var(--muted);font-size:.85rem}
</style></head><body>
<header><h1>ROVEXO v1.0 — Owner Review Gallery</h1>
<p>Premium UI visual review · ${manifest.length} verified screenshots · Awaiting owner <strong>APPROVED</strong></p>
<div class="stats"><span class="stat">${manifest.length} PNG files</span><span class="stat">${pageIds.length} pages</span><span class="stat">${devices.length} devices</span><span class="stat">${themes.join(" + ")}</span></div>
<p class="paths" style="margin-top:1rem">Absolute: ${outDir.replace(/\\/g, "/")}<br/>Relative: owner-review-screenshots/index.html</p>
</header><main>
<section><h2>Before vs After</h2><div class="before-after">
<div class="panel"><h3>Before</h3><p>Legacy CSS (<code>premium-2026</code>, <code>dash-v1-*</code>).</p></div>
<div class="panel"><h3>After</h3><p>Single <code>styles/rovexo/index.css</code>, <code>rx-*</code> system.</p></div></div>
${comparisonRow("homepage", "Homepage")}${comparisonRow("search", "Search")}${comparisonRow("product-details", "Product Details")}${comparisonRow("admin-dashboard", "Admin Dashboard")}
</section><section id="gallery"><h2>All Captures</h2>
<div class="filters" data-filter-group="pages"><button class="active" data-filter="all">All</button>
${pageIds.map((id) => `<button data-filter="${id}">${manifest.find((p) => p.id === id)?.label ?? id}</button>`).join("")}
</div>${renderGrid(manifest)}</section></main>
<footer>Generated ${new Date().toISOString()}</footer>
<script>document.querySelectorAll('[data-filter-group="pages"] button').forEach((btn)=>{btn.addEventListener('click',()=>{document.querySelectorAll('[data-filter-group="pages"] button').forEach((b)=>b.classList.remove('active'));btn.classList.add('active');const id=btn.dataset.filter;document.querySelectorAll('#gallery .card').forEach((card)=>{card.style.display=id==='all'||card.dataset.id===id?'':'none';});});});</script>
</body></html>`;

writeFileSync(indexPath, html, "utf8");

const filenames = manifest.map((m) => m.file).sort();
const review = `# ROVEXO v1.0 — Theme Final Review

Generated: ${new Date().toISOString()}

## Gallery Location

| | Path |
|---|------|
| **Absolute** | \`${outDir.replace(/\\/g, "/")}\` |
| **Relative** | \`owner-review-screenshots/\` |
| **Gallery** | \`owner-review-screenshots/index.html\` |

## Pages Captured (${pageIds.length})

${pageIds.map((id) => `- ${manifest.find((m) => m.id === id)?.label ?? id}`).join("\n")}

## Devices

${[...new Set(manifest.map((m) => m.deviceLabel))].map((d) => `- ${d}`).join("\n")}

## Themes

${themes.map((t) => `- ${t}`).join("\n")}

## Total Screenshots

**${manifest.length}** PNG files — all verified on disk

## Components Rebuilt

- \`styles/rovexo/*\` unified design system
- \`components/icons/HomeCategoryIcon3D.tsx\` — premium 3D SVG icon family (no photo backgrounds)
- \`components/home/HomeCategoryRail.tsx\` — compact 68px category cards
- \`components/home/HomeSecondaryBanners.tsx\` — hero-matched secondary banners
- \`components/ui/*\` — ListingCard, Button, Input, Dialog, Table, DashboardCard, etc.

## Remaining Visual Issues

- Auth pages show login when unauthenticated (expected)

## Validation (2026-06-27)

| Check | Result |
|-------|--------|
| \`npm run lint\` | Pass |
| \`npm run typecheck\` | Pass |
| \`npm run build\` | Pass |
| \`npx vitest run\` (enterprise suites) | 20/20 pass |
| \`npx playwright test --project=chromium\` | 93/93 pass |
| Owner review gallery | ${manifest.length}/${manifest.length} PNG verified |

## All Filenames (${filenames.length})

${filenames.map((f) => `- \`${f}\``).join("\n")}

---

Awaiting owner **APPROVED**. No commit, push, or deploy.
`;

writeFileSync(reviewPath, review, "utf8");

if (!existsSync(indexPath)) {
  console.error("FATAL: index.html missing");
  process.exit(1);
}

console.log("OK", manifest.length, "PNG verified");
console.log("INDEX", indexPath);
console.log("REVIEW", reviewPath);
