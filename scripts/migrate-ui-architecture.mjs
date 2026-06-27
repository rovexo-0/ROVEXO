/**
 * One-time UI architecture migration: legacy class names → rx-* design system.
 * Run: node scripts/migrate-ui-architecture.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const root = join(import.meta.dirname, "..");

const CSS_REPLACEMENTS = [
  [/\bpremium-glass\b/g, "rx-glass"],
  [/\bpremium-depth-1\b/g, "rx-depth-1"],
  [/\bpremium-depth-2\b/g, "rx-depth-2"],
  [/\bpremium-depth-3\b/g, "rx-depth-3"],
  [/\bpremium-glow\b/g, "rx-glow"],
  [/\bpremium-card\b/g, "rx-surface-card"],
  [/\bpremium-btn--primary\b/g, "rx-btn--primary"],
  [/\bpremium-btn\b/g, "rx-btn"],
  [/\bpremium-icon-3d\b/g, "rx-icon-3d"],
  [/\bpremium-float\b/g, "rx-float"],
  [/\bpremium-pulse-glow\b/g, "rx-pulse-glow"],
  [/\bpremium-shimmer\b/g, "rx-shimmer"],
  [/\bpremium-image-depth\b/g, "rx-image-depth"],
  [/\bpremium-enter\b/g, "rx-enter"],
  [/\bpremium-page-header\b/g, "rx-page-header"],
  [/\bpremium-footer-bar\b/g, "rx-footer-bar"],
  [/\bpremium-form-section\b/g, "rx-form-section"],
  [/\bpremium-input\b/g, "rx-input"],
  [/\bpremium-sheet-overlay\b/g, "rx-sheet-overlay"],
  [/\bpremium-sheet\b/g, "rx-sheet"],
  [/\bpremium-skeleton\b/g, "rx-skeleton"],
  [/\bpremium-menu-row\b/g, "rx-menu-row"],
  [/\bpremium-upload-zone\b/g, "rx-upload"],
  [/\bpremium-chip\b/g, "rx-chip"],
  [/\bpremium-surface-panel\b/g, "rx-panel"],
  [/\bdash-v1-/g, "rx-dash-"],
  [/\benterprise-hub-/g, "rx-hub-"],
  [/\bhero-banner-2026\b/g, "rx-hero-banner"],
  [/\bcategory-tile-2026\b/g, "rx-category-tile"],
  [/\bcategory-rail-2026\b/g, "rx-category-rail"],
  [/\bbottom-nav-shell-2026\b/g, "rx-bottom-nav-shell"],
  [/\bbottom-nav-grid-2026\b/g, "rx-bottom-nav-grid"],
  [/\bbottom-nav-item-2026\b/g, "rx-bottom-nav-item"],
  [/\bbottom-nav-icon-3d\b/g, "rx-bottom-nav-icon"],
  [/\bbottom-nav-tab-icon-2026\b/g, "rx-bottom-nav-tab-icon"],
  [/\bbottom-nav-sell-2026\b/g, "rx-bottom-nav-sell"],
  [/\bglass-surface-2026\b/g, "rx-glass-surface"],
  [/\bheader-premium-2026\b/g, "rx-header-shell"],
  [/\bsearch-bar-2026\b/g, "rx-search-bar"],
  [/\btouch-target-2026\b/g, "rx-touch-target"],
  [/\bbring-your-item-banner-2026\b/g, "rx-migration-banner"],
  [/\bmarketplace-listing-card__/g, "rx-listing-card__"],
  [/\bmarketplace-listing-card\b/g, "rx-listing-card"],
  [/\bmarketplace-listing-grid\b/g, "rx-listing-grid"],
  [/\bmarketplace-listing-carousel\b/g, "rx-listing-carousel"],
  [/\bhero-banner-2026__/g, "rx-hero-banner__"],
  [/\bcategory-tile-2026__/g, "rx-category-tile__"],
  [/\bbottom-nav-item-2026__/g, "rx-bottom-nav-item__"],
  [/\bheader-premium-2026__/g, "rx-header-shell__"],
  [/\bbring-your-item-banner-2026__/g, "rx-migration-banner__"],
  [/\bpremium-v1-/g, "rx-type-"],
  [/\bsell-premium-v1\b/g, "rx-sell"],
  [/\bhome-premium-polish\b/g, "rx-home-polish"],
  [/\bmobile-premium\b/g, "rx-mobile"],
  [/\bauctions-2026\b/g, "rx-auctions"],
];

const CSS_VAR_REPLACEMENTS = [
  [/--dash-v1-/g, "--rx-dash-"],
];

const SOURCE_DIRS = ["components", "features", "app", "tests", "e2e", "lib"];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === ".next" || entry === "scripts") continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if ([".tsx", ".ts", ".css"].includes(extname(entry))) files.push(full);
  }
  return files;
}

function migrateContent(content, isCss = false) {
  let out = content;
  for (const [from, to] of CSS_REPLACEMENTS) out = out.replace(from, to);
  if (isCss) {
    for (const [from, to] of CSS_VAR_REPLACEMENTS) out = out.replace(from, to);
  }
  return out;
}

function migrateCssFile(srcRelative, destRelative) {
  const src = join(root, srcRelative);
  const dest = join(root, destRelative);
  mkdirSync(join(dest, ".."), { recursive: true });
  const content = migrateContent(readFileSync(src, "utf8"), true);
  writeFileSync(dest, content, "utf8");
  console.log(`CSS: ${srcRelative} → ${destRelative}`);
}

// Migrate legacy CSS into rovexo/
const cssMigrations = [
  ["styles/premium-v1-typography.css", "styles/rovexo/typography.css"],
  ["styles/premium-2026.css", "styles/rovexo/utilities.css"],
  ["styles/locked-2026.css", "styles/rovexo/layout.css"],
  ["styles/dashboard-v1.css", "styles/rovexo/dashboard.css"],
  ["styles/mobile-premium.css", "styles/rovexo/mobile.css"],
  ["styles/import-hero-banner.css", "styles/rovexo/hero.css"],
  ["styles/auctions-2026.css", "styles/rovexo/auctions.css"],
  ["styles/sell-premium-v1.css", "styles/rovexo/sell.css"],
  ["styles/home-premium-polish.css", "styles/rovexo/home-polish.css"],
  ["features/account-page/styles/account-page.css", "styles/rovexo/account.css"],
  ["components/home/home-category-rail.css", "styles/rovexo/category-rail.css"],
];

for (const [src, dest] of cssMigrations) {
  migrateCssFile(src, dest);
}

// Migrate source files
let changed = 0;
for (const dir of SOURCE_DIRS) {
  const fullDir = join(root, dir);
  if (!existsSync(fullDir)) continue;
  for (const file of walk(fullDir)) {
    if (file.includes("migrate-ui-architecture")) continue;
    const original = readFileSync(file, "utf8");
    const migrated = migrateContent(original, file.endsWith(".css"));
    if (migrated !== original) {
      writeFileSync(file, migrated, "utf8");
      changed++;
    }
  }
}

// Update tokens.ts exports
const tokensPath = join(root, "components/ui/tokens.ts");
let tokens = readFileSync(tokensPath, "utf8");
tokens = tokens
  .replace(/premiumPageHeader/g, "rxPageHeader")
  .replace(/premiumFormSection/g, "rxFormSection")
  .replace(/premiumInput/g, "rxInput")
  .replace(/premiumFooterBar/g, "rxFooterBar")
  .replace(/premiumChip/g, "rxChip")
  .replace(/premiumSurfacePanel/g, "rxSurfacePanel")
  .replace(/"premium-page-header"/g, '"rx-page-header"')
  .replace(/"premium-form-section"/g, '"rx-form-section"')
  .replace(/"premium-input"/g, '"rx-input"')
  .replace(/"premium-footer-bar"/g, '"rx-footer-bar"')
  .replace(/"premium-chip"/g, '"rx-chip"')
  .replace(/"premium-surface-panel"/g, '"rx-panel"');
writeFileSync(tokensPath, tokens, "utf8");

// Write new index.css
writeFileSync(
  join(root, "styles/rovexo/index.css"),
  `/**
 * ROVEXO Design System v1 — single presentation entry point.
 */
@import "../tokens.css";
@import "./typography.css";
@import "./forms.css";
@import "./cards.css";
@import "./shell.css";
@import "./utilities.css";
@import "./layout.css";
@import "./dashboard.css";
@import "./mobile.css";
@import "./hero.css";
@import "./auctions.css";
@import "./sell.css";
@import "./home-polish.css";
@import "./account.css";
@import "./category-rail.css";
`,
  "utf8",
);

console.log(`\nMigrated ${changed} source files.`);
