import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function stripComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("COD SÂNGE — rendered selector proof (Hub freeze preserved)", () => {
  const conv = stripComments(readSource("styles/rovexo/conversation-hub-v1.css"));
  const bottomActions = readSource("features/transaction-hub/TransactionHubBottomActions.tsx");

  it("identifies sticky Offer/Counter card selectors without border:none redesign", () => {
    expect(bottomActions).toContain("thub-v1__actions--pending");
    expect(bottomActions).toContain("thub-v1__actions--countered");
    expect(bottomActions).toContain("Counter Offer");
    expect(conv).not.toMatch(/\.thub-v1__actions--pending\s*\{[^}]*border:\s*none\s*!important/);
    expect(conv).not.toMatch(/\.thub-v1__actions--countered\s*\{[^}]*border:\s*none\s*!important/);
  });

  it("Counter Offer input keeps 16px (iOS) with existing border chrome", () => {
    expect(conv).toMatch(
      /\.thub-v1__counter-input\s*\{[\s\S]*?border:\s*1px\s+solid[\s\S]*?font-size:\s*16px/,
    );
  });
});
