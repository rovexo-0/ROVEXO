import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSoldSummary } from "@/lib/orders/hub-summary";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Orders Hub v1.0 master implementation", () => {
  it("locks 2x2 stats, chips, and text-only empty state", () => {
    const hub = readSource("features/orders/components/OrdersHubV1.tsx");
    const css = readSource("styles/rovexo/orders-hub-v1.css");

    expect(hub).toContain('data-orders-ui="v1.0-master-implementation"');
    expect(hub).toContain("orders-v2__stats");
    expect(hub).toContain("No orders yet.");
    expect(hub).not.toContain("Browse Marketplace");
    expect(hub).not.toContain("Sell an Item");
    expect(hub).not.toContain("Search order");
    expect(hub).not.toContain("Newest");
    expect(css).toContain("grid-template-columns: 1fr 1fr");
    expect(css).toContain("height: 156px");
    expect(css).toContain("height: 84px");
    expect(css).toContain("height: 58px");
    expect(css).toContain("width: 170px");
    expect(css).toContain("height: 48px");
    expect(css).toContain("border-radius: 24px");
    expect(css).toContain("margin-top: 100px");
    expect(css).toContain("font-size: 26px");
    expect(css).not.toContain("scroll-snap-type");
  });

  it("uses approved empty sold-card copy", () => {
    const sold = buildSoldSummary([]);
    expect(sold.map((c) => [c.title, c.value, c.subtitle])).toEqual([
      ["Total Sales", "£0.00", "All time"],
      ["Pending Payout", "£0.00", "Nothing to withdraw"],
      ["Orders", "0", "All orders"],
      ["Positive Feedback", "0%", "0 Reviews"],
    ]);
  });
});
