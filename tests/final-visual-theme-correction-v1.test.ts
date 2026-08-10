import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function stripComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("ROVEXO Final Visual Theme Correction (COD SÂNGE)", () => {
  const theme = stripComments(readSource("styles/rovexo/black-underground-theme-v1.css"));
  const search = stripComments(readSource("styles/rovexo/search-landing-v1.css"));
  const conv = stripComments(readSource("styles/rovexo/conversation-hub-v1.css"));
  const wallet = stripComments(readSource("styles/rovexo/wallet-hub-v1.css"));
  const orders = stripComments(readSource("styles/rovexo/orders-page-v1.css"));
  const hmrc = stripComments(readSource("styles/rovexo/hmrc-reporting-centre-v1.css"));

  it("Browse category cards + search bar use theme tokens / dark overrides", () => {
    expect(search).toContain("--srch-land-text: var(--rvx-text-primary");
    expect(search).toContain("--srch-land-field-bg: var(--cds-color-surface-muted");
    expect(theme).toContain(".srch-land__cat-name");
    expect(theme).toContain(".srch-land__cat-count");
    expect(theme).toMatch(/\.srch-land__cat-name[\s\S]*var\(--rvx-text-primary\)/);
    expect(theme).toContain(".srch-land__bar-input");
  });

  it("Counter Offer outer border is removed", () => {
    expect(conv).toMatch(/\.conv-hub__offer--countered\s*\{[^}]*border-color:\s*transparent/);
    expect(theme).toMatch(/\.conv-hub__offer--countered[\s\S]*border:\s*none/);
  });

  it("Balance wallet chrome text uses theme tokens (no hardcoded black)", () => {
    expect(wallet).not.toMatch(/\.wallet-v2__metric-amount\s*\{[^}]*color:\s*#111\b/);
    expect(wallet).not.toMatch(/\.wallet-v2__section-title\s*\{[^}]*color:\s*#18181b/);
    expect(wallet).toMatch(/\.wallet-v2__metric-amount\s*\{[^}]*color:\s*var\(--wallet-text\)/);
    expect(theme).toContain(".wallet-v2__metric-amount");
    expect(theme).toContain(".wallet-v2__section-title");
  });

  it("Orders + My Listings text tokens + 16px horizontal pad (no nested double pad)", () => {
    expect(orders).toContain("--orders-text: var(--rvx-text-primary");
    expect(orders).toMatch(/\.orders-page__chip\s*\{[^}]*color:\s*var\(--orders-text\)/);
    expect(orders).toContain("padding-inline: var(--fw-pad-x, 16px)");
    expect(orders).toContain("[data-listings-version]");
    expect(theme).toContain(".orders-page__chip--on");
    expect(theme).toContain("[data-listings-version] .cds-button--secondary");
  });

  it("HMRC Reporting Centre inherits Theme Engine surfaces/text", () => {
    expect(hmrc).toContain("--hmrc-surface: var(--rvx-surface");
    expect(hmrc).toContain("--hmrc-text: var(--rvx-text-primary");
    expect(hmrc).toMatch(/\.hmrc-rc__card\s*\{[^}]*background:\s*var\(--hmrc-surface\)/);
    expect(theme).toContain("[data-hmrc-reporting-centre]");
    expect(theme).toContain(".hmrc-rc__progress-track");
    expect(hmrc).not.toMatch(/\.hmrc-rc__card\s*\{[^}]*background:\s*#fff\b/);
  });

  it("no product/category image filters or blur introduced by theme", () => {
    const values = [
      ...theme.matchAll(/(?:^|[^a-zA-Z0-9_-])(?:-webkit-)?(?:backdrop-)?filter\s*:\s*([^;!}{]+)/g),
    ].map((m) => m[1].trim());
    for (const value of values) {
      expect(value).toBe("none");
    }
    expect(theme).not.toMatch(/blur\s*\(/);
    expect(theme).not.toMatch(/html\[data-theme=["']dark["']\]\s+img\s*\{/);
  });
});
