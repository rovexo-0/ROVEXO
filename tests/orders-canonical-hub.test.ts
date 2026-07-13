import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Orders Hub v1.0 minimal canonical", () => {
  it("locks minimal section tree and forbids statistics", () => {
    const hub = readSource("features/orders/components/OrdersHubV1.tsx");
    const css = readSource("styles/rovexo/orders-hub-v1.css");

    expect(hub).toContain('data-orders-ui="v1.0-minimal-canonical"');
    expect(hub).toContain('label: "All"');
    expect(hub).toContain('label: "Processing"');
    expect(hub).toContain('label: "Completed"');
    expect(hub).not.toContain('label: "Shipping"');
    expect(hub).not.toContain('label: "Cancelled"');
    expect(hub).toContain("No orders yet.");
    expect(hub).toContain("Your sold items will appear here.");
    expect(hub).not.toContain("Total Sales");
    expect(hub).not.toContain("Pending Payout");
    expect(hub).not.toContain("Positive Feedback");
    expect(hub).not.toContain("Browse Marketplace");
    expect(hub).not.toContain("Sell an Item");
    expect(hub).not.toContain("orders-v2__stats");
    expect(css).not.toContain("orders-v2__stats");
    expect(css).not.toContain("orders-v2__stat-card");
    expect(css).toContain("orders-v2__empty-icon");
    expect(css).toContain("width: 80px");
    expect(css).toContain("opacity: 0.35");
    expect(css).toContain("margin-top: 96px");
    expect(css).toContain("font-size: 26px");
    expect(css).toContain("font-size: 34px");
  });
});
