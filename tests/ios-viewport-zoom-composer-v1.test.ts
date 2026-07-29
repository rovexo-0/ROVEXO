import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

/**
 * iOS WebKit auto-zooms focused inputs when computed font-size < 16px,
 * and that scale often persists after Conversation → Inbox navigation.
 */
describe("iOS viewport zoom — Conversation composer lock", () => {
  it("locks composer field at 16px to prevent Safari/Chrome auto-zoom", () => {
    const css = readSource("styles/rovexo/conversation-hub-v1.css");
    const block = css.slice(
      css.indexOf(".conv-hub__composer-field {"),
      css.indexOf(".conv-hub__composer-field:focus"),
    );
    expect(block).toContain("font-size: 16px");
    expect(block).not.toContain("font-size: 14px");
    expect(block).toContain("::placeholder");
  });

  it("exports a single root viewport SSOT from app/layout.tsx", () => {
    const layout = readSource("app/layout.tsx");
    expect(layout).toContain("export const viewport");
    expect(layout).toContain('width: "device-width"');
    expect(layout).toContain("initialScale: 1");
    expect(layout).not.toContain("maximumScale");
  });
});
