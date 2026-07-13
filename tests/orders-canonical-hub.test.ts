import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSoldSummary } from "@/lib/orders/hub-summary";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Orders Hub v1.0 final statistics", () => {
  it("locks 4-column stats row and text-only empty state", () => {
    const hub = readSource("features/orders/components/OrdersHubV1.tsx");
    const css = readSource("styles/rovexo/orders-hub-v1.css");

    expect(hub).toContain('data-orders-ui="v1.0-final-statistics"');
    expect(hub).toContain("orders-v2__stats");
    expect(hub).toContain("No orders yet.");
    expect(hub).not.toContain("Browse Marketplace");
    expect(hub).not.toContain("Sell an Item");
    expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(css).toContain("gap: 12px");
    expect(css).toContain("height: 128px");
    expect(css).toContain("font-size: 30px");
    expect(css).toContain("line-height: 34px");
    expect(css).toContain("width: 40px");
    expect(css).toContain("height: 46px");
    expect(css).toContain("border-radius: 23px");
    expect(css).toContain("margin-top: 20px");
    expect(css).not.toContain("scroll-snap-type");
  });

  it("uses approved empty sold-card copy", () => {
    const sold = buildSoldSummary([]);
    expect(sold.map((c) => [c.title, c.value, c.subtitle])).toEqual([
      ["Total Sales", "£0.00", "All time"],
      ["Pending Payout", "£0.00", "Nothing to withdraw"],
      ["Orders", "0", "All Orders"],
      ["Positive Feedback", "0%", "0 Reviews"],
    ]);
  });
});
