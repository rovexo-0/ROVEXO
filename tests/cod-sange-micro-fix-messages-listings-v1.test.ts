import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function stripComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("COD SÂNGE micro-fix — Hub freeze (no border redesign)", () => {
  const conv = stripComments(readSource("styles/rovexo/conversation-hub-v1.css"));

  it("does not strip Offer / Counter Offer outer borders (Hub freeze)", () => {
    expect(conv).not.toMatch(/\.conv-hub__offer\s*\{[^}]*border:\s*none\s*!important/);
    expect(conv).not.toMatch(/\.thub-v1__actions--pending\s*\{[^}]*border:\s*none\s*!important/);
    expect(conv).not.toMatch(/\.thub-v1__actions--countered\s*\{[^}]*border:\s*none\s*!important/);
  });

  it("Counter Offer iOS input keeps font-size 16px without layout redesign", () => {
    expect(conv).toMatch(/\.thub-v1__counter-input\s*\{[\s\S]*?font-size:\s*16px/);
    expect(conv).toMatch(/\.conv-hub__counter-input\s*\{[\s\S]*?font-size:\s*16px/);
  });

  it("does not introduce image filter/blur for these fixes", () => {
    /* Allow explicit filter:none (product image absolute law). Forbid blur / other filters. */
    expect(conv).not.toMatch(/filter\s*:\s*[^;]*blur/);
    expect(conv).not.toMatch(
      /\.conv-hub__offer-thumb-img\s*\{[^}]*(?:brightness|contrast|saturate|opacity)\s*:/,
    );
    expect(conv).toMatch(/\.conv-hub__offer-thumb-img[\s\S]*?filter:\s*none/);
  });
});
