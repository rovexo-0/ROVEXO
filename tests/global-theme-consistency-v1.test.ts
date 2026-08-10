import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function stripComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("ROVEXO Global Theme Consistency v1.0", () => {
  const theme = readSource("styles/rovexo/black-underground-theme-v1.css");
  const themeCode = stripComments(theme);
  const tokens = readSource("styles/tokens.css");
  const conv = readSource("styles/rovexo/conversation-hub-v1.css");
  const inbox = readSource("styles/rovexo/inbox-hub-v1.css");
  const sell = readSource("styles/rovexo/sell.css");

  it("keeps one Theme Engine SSOT (html data-theme + --rvx-* only)", () => {
    expect(tokens).toContain('[data-theme="dark"]');
    expect(tokens).toContain("--rvx-page: #0d0f14");
    expect(theme).toContain('html[data-theme="dark"]');
    expect(theme).not.toContain("--messages-dark-bg");
    expect(theme).not.toContain("--sell-dark-bg");
    expect(theme).not.toContain("--profile-dark-bg");
    expect(theme).not.toContain("--settings-dark-bg");
  });

  it("Messages / Conversation dark surfaces use --rvx-* (no hardcoded white body)", () => {
    expect(themeCode).toContain("--conv-body-bg: var(--rvx-page)");
    expect(themeCode).toMatch(
      /html\[data-theme="dark"\][\s\S]*?\.conv-hub__body[\s\S]*?background:\s*var\(--conv-body-bg\)/,
    );
    expect(stripComments(conv)).not.toMatch(/\.conv-hub__body\s*\{[^}]*background:\s*#fff\b/);
    expect(themeCode).toContain(".conv-hub__body");
    expect(themeCode).toContain(".conv-hub__composer-field");
    expect(themeCode).toContain("--conv-incoming: var(--rvx-surface-secondary)");
  });

  it("Inbox dark tokens + surfaces", () => {
    expect(inbox).toContain("--inbox-chip-bg");
    expect(inbox).toContain("--inbox-thumb-bg");
    expect(themeCode).toContain("--inbox-surface: var(--rvx-surface)");
    expect(themeCode).toContain("--inbox-chip-bg: var(--rvx-surface-secondary)");
  });

  it("Sell dark text/inputs are theme-aware", () => {
    expect(sell).toContain("var(--cds-color-text-primary");
    expect(themeCode).toContain("[data-sell-shell]");
    expect(themeCode).toContain("listing-attribute-label");
    expect(themeCode).toMatch(/\[data-sell-shell\][\s\S]*color:\s*var\(--rvx-text-primary\)/);
    expect(themeCode).toMatch(/\[data-sell-shell\] input[\s\S]*background:\s*var\(--rvx-surface-secondary\)/);
  });

  it("headers / menus / bottom nav / modals / drawers remain theme-wired", () => {
    expect(themeCode).toContain(".rx-h2");
    expect(themeCode).toContain(".cds-menu-row");
    expect(themeCode).toContain('[data-bottom-nav="v2"]');
    expect(themeCode).toContain('[role="dialog"]');
    expect(themeCode).toContain("[data-drawer]");
  });

  it("product image protection — no theme filters / no blur in theme CSS", () => {
    const values = [
      ...themeCode.matchAll(/(?:^|[^a-zA-Z0-9_-])(?:-webkit-)?(?:backdrop-)?filter\s*:\s*([^;!}{]+)/g),
    ].map((m) => m[1].trim());
    for (const value of values) {
      expect(value).toBe("none");
    }
    expect(themeCode).not.toMatch(/blur\s*\(/);
    expect(themeCode).not.toMatch(/html\[data-theme=["']dark["']\]\s+img\s*\{/);
  });

  it("buyer/incoming bubbles use theme tokens (not marketplace listing card redesign)", () => {
    expect(stripComments(conv)).toMatch(/\.conv-hub__bubble--buyer\s*\{/);
    expect(stripComments(conv)).toMatch(
      /\.conv-hub__bubble--seller\s*\{[^}]*background:\s*var\(--conv-purple\)/,
    );
    expect(themeCode).toContain("--conv-incoming: var(--rvx-surface-secondary)");
  });
});
