import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Offer Pending compact action panel (UI only)", () => {
  it("uses the single canonical TransactionHubBottomActions pending panel", () => {
    const bar = readSource("features/inbox/components/TransactionActionBar.tsx");
    const actions = readSource("features/transaction-hub/TransactionHubBottomActions.tsx");
    expect(bar).toContain("TransactionHubBottomActions");
    expect(actions).toContain("thub-v1__actions--pending");
    expect(actions).toContain("Offer Pending");
    expect(actions).toContain("Accept");
    expect(actions).toContain("Counter");
    expect(actions).toContain("Decline");
    expect(actions).toContain("onAcceptOffer");
    expect(actions).toContain("onCounterOffer");
    expect(actions).toContain("onDeclineOffer");
    expect(actions).toContain("formatCurrency(pendingOffer.amount)");
    /* No parallel pending component */
    expect(actions).not.toContain("OfferPendingCard");
    expect(actions).not.toContain("OfferPendingV2");
  });

  it("compacts pending/countered panel spacing and button height", () => {
    const css = readSource("styles/rovexo/conversation-hub-v1.css");
    expect(css).toMatch(
      /\.thub-v1__actions--pending,\s*\n\.thub-v1__actions--countered\s*\{[\s\S]*?padding:\s*8px\s+10px/,
    );
    expect(css).toMatch(
      /\.thub-v1__actions--pending,\s*\n\.thub-v1__actions--countered\s*\{[\s\S]*?gap:\s*6px/,
    );
    expect(css).toMatch(
      /\.thub-v1__actions--pending \.thub-v1__btn,\s*\n\.thub-v1__actions--countered \.thub-v1__btn\s*\{[\s\S]*?height:\s*42px/,
    );
    expect(css).toContain(".thub-v1__btn-row--triple");
    expect(css).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)/);
    /* Do not clip with a fixed short max-height */
    expect(css).not.toMatch(/\.thub-v1__actions--pending\s*\{[^}]*max-height:\s*\d+px/);
  });

  it("dark theme uses --rvx tokens for pending panel and actions", () => {
    const theme = readSource("styles/rovexo/black-underground-theme-v1.css");
    expect(theme).toContain('html[data-theme="dark"] .thub-v1__actions--pending');
    expect(theme).toContain("var(--rvx-surface)");
    expect(theme).toContain("var(--rvx-border)");
    expect(theme).toContain("var(--rvx-accent");
    expect(theme).toContain('html[data-theme="dark"] .thub-v1__status-amount');
    expect(theme).toContain(
      'html[data-theme="dark"] .thub-v1__actions--pending .thub-v1__btn--primary',
    );
  });
});
