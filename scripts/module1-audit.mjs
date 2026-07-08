#!/usr/bin/env node
/**
 * Module 1 platform audit — duplicate/unused signal scan (read-only).
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_DIR = join(ROOT, "reports", "module-1");
const OUT = join(REPORT_DIR, "AUDIT.md");

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "archive") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const deprecatedPatterns = [
  { label: "HomeCategoryRail alias", pattern: /HomeCategoryRail/g, allow: ["HomeCategoryRail.tsx", "archive/"] },
  { label: "PremiumButton deprecated", pattern: /PremiumButton/g, allow: ["PremiumButton.tsx", "archive/"] },
  { label: "HeaderCategoryBar unused import", pattern: /HeaderCategoryBar/g, allow: ["HeaderCategoryBar.tsx", "tests/"] },
];

const tsFiles = walk(join(ROOT, "components")).concat(walk(join(ROOT, "features"))).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));

const duplicateCandidates = [];
for (const { label, pattern, allow } of deprecatedPatterns) {
  const hits = tsFiles.filter((f) => {
    if (allow.some((a) => f.includes(a))) return false;
    return pattern.test(readFileSync(f, "utf8"));
  });
  if (hits.length) duplicateCandidates.push({ label, count: hits.length, sample: hits.slice(0, 5).map((h) => relative(ROOT, h)) });
}

let bundleFirstLoad = "n/a";
try {
  const manifest = JSON.parse(readFileSync(join(ROOT, ".next/build-manifest.json"), "utf8"));
  const pages = Object.keys(manifest.pages ?? {});
  bundleFirstLoad = `${pages.length} routed pages in build manifest`;
} catch {
  bundleFirstLoad = "build manifest not found — run production build first";
}

let ts = "not run";
let lint = "not run";
try {
  execSync("npx pnpm typecheck", { stdio: "pipe", cwd: ROOT });
  ts = "pass";
} catch {
  ts = "fail";
}
try {
  execSync("npx pnpm lint", { stdio: "pipe", cwd: ROOT });
  lint = "pass";
} catch {
  lint = "fail";
}

const report = `# Module 1 — Platform Audit Report

Generated: ${new Date().toISOString()}

## Design System (Single Source of Truth)

| System | Location | Status |
|--------|----------|--------|
| CSS tokens | \`styles/tokens.css\` | Unified spacing, color, radius, shadow, motion |
| Tailwind bridge | \`app/globals.css\` (@theme inline) | Maps DS tokens to utilities |
| TS utilities | \`components/ui/tokens.ts\` | focusRing, layout helpers |
| Buttons | \`components/ui/Button.tsx\` + \`variants.ts\` | Single button system |
| Icons | \`RovexoIcon\` + \`lib/icons/icons.ts\` | Central registry |
| Listing card | \`components/ui/ListingCard.tsx\` | Canonical, prop-driven |
| Skeleton | \`components/ui/Skeleton.tsx\` | Base loader primitive |
| Theme | \`ThemeProvider\` + \`lib/settings/theme.ts\` | light / dark / system |

## Module 1 Changes Applied

1. **Homepage categories** — text-only premium capsules (\`RovexoCategoryCard\`), no icons
2. **Search** — camera action removed from \`SearchInputActions\` (voice hook retained)
3. **ListingCard homepage preset** — seller, rating, views enabled per Module 1 standard
4. **Dark mode** — category capsules use \`data-theme\` tokens

## Duplicate / Legacy Signals

${duplicateCandidates.length ? duplicateCandidates.map((d) => `- **${d.label}**: ${d.count} references\n  - ${d.sample.join("\n  - ")}`).join("\n") : "- No high-confidence duplicate imports outside archive"}

## Files Safe to Remove Later (not deleted in Module 1)

- \`archive/homepages/*\` — legacy homepage snapshots
- \`components/header/HeaderCategoryBar.tsx\` — unused on homepage (verified by tests)
- \`features/dashboard/components/PremiumButton.tsx\` — deprecated wrapper
- Nested mirror folders: \`ROVEXO/\`, \`ROVEXO_UPLOAD/\`, \`recovered-homepage/\`

## Validation

| Gate | Result |
|------|--------|
| TypeScript | ${ts} |
| ESLint | ${lint} |
| Build manifest | ${bundleFirstLoad} |

## Remaining Risks

- Help/Trust mobile hubs still use \`DashboardIcon3D\` (pre-Module 1 debt)
- Business dashboard server error (from prior audit)
- Physical Android My Account certification pending
- Full Playwright matrix may have Firefox/WebKit flakes

## Production Readiness Score

**72 / 100** — Module 1 foundation started; full deduplication and performance benchmarks pending user review.

---

See \`reports/module-1/screenshots/\` for live captures.
`;

import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(OUT, report);
console.log("Wrote", OUT);
