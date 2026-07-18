import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("100% Phone Width Freeze — Absolute Final", () => {
  it("ships one phone-width SSOT stylesheet imported last", () => {
    const index = readSource("styles/rovexo/index.css");
    const freeze = readSource("styles/rovexo/phone-width-v1-freeze.css");
    expect(index).toContain('./phone-width-v1-freeze.css');
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
      "max-w-4xl",
      "max-w-6xl",
      "max-w-\\[440px\\]",
    ]) {
      expect(freeze).toContain(`.${token}`);
    }
  });
});
