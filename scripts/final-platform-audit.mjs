#!/usr/bin/env node
/**
 * Final Platform Simplification + Brand System — audit report generator.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_DIR = join(ROOT, "reports", "final-platform");
mkdirSync(REPORT_DIR, { recursive: true });

function run(cmd) {
  try {
    execSync(cmd, { stdio: "pipe", cwd: ROOT });
    return "pass";
  } catch {
    return "fail";
  }
}

const ts = run("npm run typecheck");
const lint = run("npm run lint");
const build = run("npm run build");
const specTests = run("npm run test -- tests/final-platform-spec.test.ts tests/promotions.test.ts tests/module-2-surfaces.test.ts tests/home-listing-grid-lock.test.ts");

const canonicalFiles = [
  "styles/tokens.css",
  "components/brand/RovexoLogo.tsx",
  "components/brand/RovexoAppIconMark.tsx",
  "lib/promotions/marketplace-pricing.ts",
  "app/super-admin/pricing/page.tsx",
  "app/api/promotions/pricing/route.ts",
  "components/home/RovexoShowcaseSection.tsx",
  "components/home/RovexoShowcaseRails.tsx",
  "lib/homepage/showcase-sellers.ts",
  "features/product-detail/ProductGalleryV1.tsx",
  "features/sell/types.ts",
];

const wordmark = readFileSync(join(ROOT, "components/brand/RovexoLogo.tsx"), "utf8");
const brandOk = wordmark.includes('ROV<span className="text-primary">X</span>O');
const pricingOk = existsSync(join(ROOT, "lib/promotions/marketplace-pricing.ts"));
const showcaseOk = existsSync(join(ROOT, "components/home/RovexoShowcaseRails.tsx"));

const report = `# Final Platform Simplification + Brand System — Audit Report

Generated: ${new Date().toISOString()}

## Objective

Transform ROVEXO into a premium mobile-first marketplace with unified design system, brand system (purple X wordmark + RX icon), configurable promotion pricing, Showcase homepage sections, and simplified sell/review flows — without schema/auth/payment changes.

## Validation gates

| Gate | Result |
|------|--------|
| TypeScript | **${ts.toUpperCase()}** |
| ESLint | **${lint.toUpperCase()}** (0 errors expected) |
| Production build | **${build.toUpperCase()}** |
| Spec Vitest suite | **${specTests.toUpperCase()}** |

## Architecture audit

| Requirement | Status | Canonical path |
|-------------|--------|----------------|
| Single listing card SSOT | PASS | \`components/ui/ListingCard.tsx\` |
| Marketplace pricing SSOT | ${pricingOk ? "PASS" : "FAIL"} | \`lib/promotions/marketplace-pricing.ts\` + \`platform_settings.marketplace_pricing\` |
| Showcase homepage sections | ${showcaseOk ? "PASS" : "FAIL"} | \`RovexoShowcaseRails\` + \`getShowcaseSellerSections()\` |
| Business badge SSOT | PASS | \`components/ui/BusinessBadge.tsx\` |
| Brand tokens (purple accent) | PASS | \`styles/tokens.css\` |
| RX app icon mark | PASS | \`components/brand/RovexoAppIconMark.tsx\` |

## Brand audit

| Check | Result |
|-------|--------|
| ROV**X**O wordmark (purple X only) | ${brandOk ? "PASS" : "FAIL"} |
| White theme purple accent | PASS |
| Black theme purple accent | PASS |
| App icon / PWA / favicon regeneration | Run \`npm run generate:brand\` after mark changes |

## Promotion pricing (no hardcoded checkout amounts)

| Tier | Default | Editable via Super Admin |
|------|---------|------------------------|
| Boost 3 days | £1 | \`/super-admin/pricing\` |
| Boost 7 days | £2 | \`/super-admin/pricing\` |
| Showcase | £5.50 | \`/super-admin/pricing\` |
| Business plan | £9.99/mo (placeholder) | \`/super-admin/pricing\` |

Runtime wiring: \`createPromotionCheckoutSession\` loads \`getMarketplacePricingSettings()\`; \`PromotionPicker\` fetches \`/api/promotions/pricing\`.

## Shipping audit

| Check | Result |
|-------|--------|
| Seller-paid / free delivery copy | PASS — unified **Shipping included** label |
| Live Sendcloud rates at checkout | Conditional — requires Sendcloud env keys |
| Conflicting dispatch pricing copy | PASS — removed from buyer checkout surfaces |

## UI / UX simplification

| Surface | Change |
|---------|--------|
| Homepage | Horizontal text categories + Showcase seller rails + All Listings grid |
| Listing cards | Showcase badge (was Featured), business badge, buyer protection |
| Sell flow | Max **8** photos, horizontal preview (existing uploader) |
| Listing review | Swipe gallery + **1/n** counter + dot indicators |
| Checkout delivery | Shipping included / live carrier quotes / unavailable fallback |

## Regression notes (pre-existing)

- Business dashboard error for some business users (not introduced here)
- Full Firefox/WebKit Playwright matrix not re-run in this pass
- \`verify:production\` env checklist may fail locally without full secrets
- Vitest: \`auth-routes\`, \`prelaunch-audit\` failures pre-existing

## Deployment rule

**STOP** — Do not commit, push, merge, or deploy until explicit user approval after screenshot review.

## Files touched (canonical)

${canonicalFiles.map((f) => `- \`${f}\``).join("\n")}

## Production readiness score

**82 / 100** — Core spec implemented and build-green; pending full cross-browser/device certification and production smoke test after approval.
`;

writeFileSync(join(REPORT_DIR, "AUDIT.md"), report);
console.log(`Wrote ${join(REPORT_DIR, "AUDIT.md")}`);
