import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("OrdersPage single source of truth", () => {
  it("uses only OrdersPage and deletes legacy Orders UI modules", () => {
    const ui = readSource("features/orders/components/OrdersPage.tsx");
    const route = readSource("app/orders/page.tsx");
    const css = readSource("styles/rovexo/orders-page-v1.css");
    const indexCss = readSource("styles/rovexo/index.css");

    expect(route).toContain("<OrdersPage");
    expect(route).not.toContain("OrdersCanonicalPage");
    expect(route).not.toContain("OrdersHubV1");
    expect(route).not.toContain("OrdersV1");
    expect(ui).toContain('data-orders-page="v1.0"');
    expect(ui).toContain('label: "All"');
    expect(ui).toContain('label: "Processing"');
    expect(ui).toContain('label: "Completed"');
    expect(ui).toContain("No orders yet.");
    expect(ui).toContain("Your sold items will appear here.");
    expect(ui).not.toContain("Total Sales");
    expect(ui).not.toContain("Shipping");
    expect(ui).not.toContain("Cancelled");
    expect(css).toContain(".orders-page");
    expect(indexCss).toContain("orders-page-v1.css");
    expect(indexCss).not.toContain("orders-hub-v1.css");
    expect(indexCss).not.toContain("orders-canonical-v1.css");

    expect(existsSync(join(process.cwd(), "features/orders/components/OrdersHubV1.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "features/orders/components/OrdersCanonicalPage.tsx"))).toBe(
      false,
    );
    expect(existsSync(join(process.cwd(), "features/account-module/components/OrdersV1.tsx"))).toBe(
      false,
    );
  });
});
