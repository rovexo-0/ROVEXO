import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const WIDTH_PATTERNS = [
  /max-w-\[480\]/,
  /max-w-\[640\]/,
  /max-w-\[720\]/,
  /max-w-\[860\]/,
  /\bmax-w-md\b/,
  /\bmax-w-lg\b/,
  /\bmax-w-xl\b/,
  /\bmax-w-3xl\b/,
  /\bmax-w-7xl\b/,
  /\bmax-w-\[22rem\]/,
];

const COMPONENT_GLASS_PATTERNS = [
  /\brx-glass\b/,
  /\brx-depth-[123]\b/,
  /\bbackdrop-blur\b/,
  /\bMobilePremiumCard\b/,
  /\bPremiumHero\b/,
];

const CONSUMER_CSS = [
  "styles/rovexo/account-center.css",
  "styles/rovexo/account-module-v1.css",
  "styles/rovexo/account-canonical-v2.css",
  "styles/rovexo/auth-v1.css",
  "styles/rovexo/canonical-ds.css",
  "styles/rovexo/checkout-v1.css",
  "styles/rovexo/conversation-hub-v1.css",
  "styles/rovexo/header-v2.css",
  "styles/rovexo/homepage-header.css",
  "styles/rovexo/home-final.css",
  "styles/rovexo/inbox-hub-v1.css",
  "styles/rovexo/orders-page-v1.css",
  "styles/rovexo/product-detail-v1.css",
  "styles/rovexo/search-results-v1.css",
  "styles/rovexo/wallet-hub-v1.css",
  "styles/rovexo/cards.css",
  "styles/rovexo/forms.css",
  "styles/rovexo/mobile.css",
  "styles/rovexo/shell.css",
  "styles/rovexo/dashboard.css",
];

const CSS_BLUR = /backdrop-filter:\s*blur\(|-webkit-backdrop-filter:\s*blur\(/;

const SCAN_ROOTS = ["features", "components"] as const;

const SKIP_PATH_PARTS = [
  "/archive/",
  "/super-admin/",
  "styles/rovexo/super-admin-premium.css",
  "features/commerce-ui/preview/",
];

const ALLOWLIST = new Set([
  "styles/rovexo/phone-width-v1-freeze.css",
  "styles/rovexo/compact-premium-v1.css",
  "tests/phone-width-freeze.test.ts",
  "tests/one-product-philosophy.test.ts",
]);

function normalizeRel(path: string): string {
  return path.replace(process.cwd() + "/", "").replace(/\\/g, "/");
}

function shouldSkip(rel: string): boolean {
  if (ALLOWLIST.has(rel)) return true;
  return SKIP_PATH_PARTS.some((part) => rel.includes(part));
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = normalizeRel(full);
    if (shouldSkip(rel)) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if ([".tsx", ".ts", ".css"].includes(extname(entry))) files.push(full);
  }
  return files;
}

function scanPatterns(roots: readonly string[], patterns: RegExp[]): string[] {
  const offenders: string[] = [];
  for (const root of roots) {
    for (const file of walk(join(process.cwd(), root))) {
      const rel = normalizeRel(file);
      const content = readFileSync(file, "utf8");
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          offenders.push(`${rel} → ${pattern}`);
        }
      }
    }
  }
  return offenders;
}

function scanConsumerCssBlur(): string[] {
  const offenders: string[] = [];
  for (const rel of CONSUMER_CSS) {
    const css = readSource(rel);
    if (CSS_BLUR.test(css)) offenders.push(`${rel} → blur()`);
  }
  return offenders;
}

describe("100% Phone Width Freeze — Absolute Final", () => {
  it("ships one phone-width SSOT stylesheet imported last", () => {
    const index = readSource("styles/rovexo/index.css");
    const freeze = readSource("styles/rovexo/phone-width-v1-freeze.css");
    expect(index).toContain("./phone-width-v1-freeze.css");
    expect(index.indexOf("phone-width-v1-freeze")).toBeGreaterThan(index.indexOf("compact-premium-v1"));
    expect(freeze).toContain("--rx-phone-inset-x: 16px");
    expect(freeze).toContain("--rx-phone-width: 100%");
    expect(freeze).toContain("100% PHONE WIDTH FREEZE");
  });

  it("locks CDS page inset and width tokens", () => {
    const cds = readSource("styles/rovexo/canonical-ds.css");
    expect(cds).toContain("--cds-space-page-x: 16px");
    expect(cds).toContain("--cds-page-max-width: 100%");
    expect(cds).toMatch(/max-width:\s*100%/);
    expect(cds).toMatch(/margin-inline:\s*0/);
  });

  it("forces consumer hubs off narrow max-width utilities", () => {
    const freeze = readSource("styles/rovexo/phone-width-v1-freeze.css");
    for (const token of [
      "max-w-md",
      "max-w-lg",
      "max-w-xl",
      "max-w-2xl",
      "max-w-3xl",
      "max-w-4xl",
      "max-w-6xl",
      "max-w-7xl",
      "max-w-\\[22rem\\]",
      "max-w-\\[440px\\]",
      "max-w-\\[480px\\]",
      "max-w-\\[640px\\]",
      "max-w-\\[720px\\]",
      "max-w-\\[860px\\]",
    ]) {
      expect(freeze).toContain(`.${token}`);
    }
  });

  it("kills glass blur on consumer hubs", () => {
    const freeze = readSource("styles/rovexo/phone-width-v1-freeze.css");
    expect(freeze).toContain("backdrop-filter: none !important");
    expect(freeze).toContain("Absolute Final — no glass");
    expect(freeze).toContain(".pd-v1__action-bar");
    expect(freeze).toContain(".ckt-v1__cta");
  });

  it("neutralizes ds-glass tokens at source (Absolute Final)", () => {
    const utilities = readSource("styles/rovexo/utilities.css");
    expect(utilities).toContain("--ds-glass-bg: #ffffff");
    expect(utilities).toContain("--ds-glass-blur: 0");
    expect(utilities).not.toMatch(/backdrop-filter:\s*blur\(/);
    expect(utilities).not.toMatch(/-webkit-backdrop-filter:\s*blur\(/);
  });

  it("has zero forbidden narrow max-width utilities on consumer surfaces", () => {
    expect(scanPatterns(SCAN_ROOTS, WIDTH_PATTERNS)).toEqual([]);
  });

  it("has zero glass/premium remnants on consumer components", () => {
    expect(scanPatterns(SCAN_ROOTS, COMPONENT_GLASS_PATTERNS)).toEqual([]);
  });

  it("has zero backdrop blur in consumer CSS sources", () => {
    expect(scanConsumerCssBlur()).toEqual([]);
  });

  it("locks consumer checkout/product/account CSS to solid surfaces", () => {
    for (const rel of [
      "styles/rovexo/checkout-v1.css",
      "styles/rovexo/product-detail-v1.css",
      "styles/rovexo/account-center.css",
      "styles/rovexo/canonical-ds.css",
    ]) {
      const css = readSource(rel);
      expect(css).not.toMatch(/backdrop-filter:\s*blur\(/);
      expect(css).not.toMatch(/-webkit-backdrop-filter:\s*blur\(/);
    }
    const checkout = readSource("styles/rovexo/checkout-v1.css");
    expect(checkout).toMatch(/\.ckt-v1__cta[\s\S]*width:\s*100%/);
  });
});
