import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("OrdersPage single source of truth", () => {
  it("uses only OrdersPage and deletes legacy Orders UI modules", () => {
    const ui = readSource("features/orders/components/OrdersPage.tsx");
    const route = readSource("app/(platform)/orders/page.tsx");
    const css = readSource("styles/rovexo/orders-page-v1.css");
    const indexCss = readSource("styles/rovexo/index.css");

    expect(route).toContain("<OrdersPage");
    expect(route).not.toContain("OrdersCanonicalPage");
    expect(route).not.toContain("OrdersHubV1");
    expect(route).not.toContain("OrdersV1");
    expect(ui).toContain("ORDERS_UI_VERSION");
    expect(ui).toContain('data-orders-ui="v7-status-lock"');
    expect(ui).toContain('label: "All"');
    expect(ui).toContain('label: "In Progress"');
    expect(ui).toContain('label: "Completed"');
    expect(ui).toContain('label: "Cancelled"');
    expect(ui).toContain("OrdersListItem");
    expect(ui).toContain("orders-page__list");
    expect(ui).not.toContain("order.orderNumber");
    expect(ui).not.toContain("CanonicalMenuRow");
    expect(ui).toContain("No orders yet.");
    expect(ui).toContain("Sold items appear here.");
    expect(ui).toContain("showHeaderTitle");
    expect(ui).not.toContain("rightAction");
    expect(ui).not.toContain("BellLineIcon");
    expect(ui).not.toContain("orders-page__notify");
    expect(ui).not.toContain("Total Sales");
    expect(css).toContain(".orders-page");
    expect(css).toContain("min-height: 48px");
    expect(css).toContain("width: 40px");
    expect(css).toContain("max-width: none");
    expect(css).not.toContain("orders-page__notify");
    // P0-01: orders-page-v1 is page-scoped on OrdersPage (not global megabundle).
    expect(ui).toContain('import "@/styles/rovexo/orders-page-v1.css"');
    expect(indexCss).not.toContain("./orders-page-v1.css");
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
