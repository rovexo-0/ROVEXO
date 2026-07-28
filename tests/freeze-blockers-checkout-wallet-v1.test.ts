import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CHECKOUT_RESUME_SESSION_UNAVAILABLE } from "@/features/transaction-hub/CheckoutHubSheet";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Freeze blockers — Checkout Ready resume fail-closed", () => {
  it("exposes Owner RVX-2010 session-unavailable copy", () => {
    expect(CHECKOUT_RESUME_SESSION_UNAVAILABLE.code).toBe("RVX-2010");
    expect(CHECKOUT_RESUME_SESSION_UNAVAILABLE.title).toContain(
      "Checkout session is no longer available",
    );
    expect(CHECKOUT_RESUME_SESSION_UNAVAILABLE.body).toContain("Return to your Order");
  });

  it("CheckoutHubSheet never wires Buy Now public Sorry dialog for resume", () => {
    const sheet = read("features/transaction-hub/CheckoutHubSheet.tsx");
    expect(sheet).not.toContain("BuyNowPublicErrorDialog");
    expect(sheet).not.toMatch(/Sorry\.\s*\\nSomething went wrong|Something went wrong\. Please try again/);
    expect(sheet).toContain("data-checkout-resume-fail-closed");
    expect(sheet).toContain("sessionUnavailable");
  });

  it("ConversationHub marks demo resume as sessionUnavailable", () => {
    const hub = read("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("sessionUnavailable={demoMode}");
  });
});

describe("Freeze blockers — Wallet Insights no clipping", () => {
  it("Insight metrics do not use ellipsis truncation", () => {
    const css = read("styles/rovexo/wallet-hub-v1.css");
    const metricsDd = css.slice(
      css.indexOf(".wallet-v2__insight-metrics dd"),
      css.indexOf(".wallet-v2__insight-metrics .is-sales"),
    );
    expect(metricsDd).toContain("overflow: visible");
    expect(metricsDd).not.toContain("text-overflow: ellipsis");
    expect(css).toContain("grid-template-columns: 1fr;");
  });
});
