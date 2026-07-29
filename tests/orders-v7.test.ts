import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ORDERS_UI_VERSION,
  resolveOrdersV7Status,
  resolveOrdersV7StatusFromStatus,
} from "@/lib/orders/orders-v7-status";
import { getStatusBadgeVariant, getOrderStatusLabel } from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Orders v7.0 — Owner status + Full Width lock", () => {
  it("locks Orders page markers and Profile Full Width", () => {
    const ui = readSource("features/orders/components/OrdersPage.tsx");
    const css = readSource("styles/rovexo/orders-page-v1.css");
    expect(ui).toContain("ORDERS_UI_VERSION");
    expect(ui).toContain('data-profile-master="v7.0"');
    expect(ui).toContain('data-full-width-surface="orders"');
    expect(ui).toContain("resolveOrdersV7Status");
    expect(ORDERS_UI_VERSION).toBe("v7.0");
    expect(css).toContain("max-width: none");
    expect(css).toContain("--orders-purple: #9333ea");
    expect(css).toContain("orders-page__item");
    expect(css).toContain("orders-page__item-thumb");
    expect(css).toContain("--orders-thumb: 56px");
    expect(css).toContain("--orders-media-gap: 12px");
    expect(css).toContain("--orders-row-min: 74px");
    expect(css).toContain("orders-page__row--green");
    expect(css).toContain("orders-page__row--purple");
    expect(css).toContain("orders-page__row--orange");
    expect(css).toContain("orders-page__row--red");
    expect(css).toContain("orders-page__row--yellow");
    expect(css).toContain("min-height: 64px");
    expect(css).not.toMatch(/max-width:\s*(600|700|900|1000|1200)px/);
    expect(css).not.toContain("cds-menu-row__value");
  });

  it("maps Owner status colours", () => {
    expect(resolveOrdersV7StatusFromStatus("completed")).toMatchObject({
      label: "Completed",
      tone: "green",
    });
    expect(resolveOrdersV7StatusFromStatus("delivered")).toMatchObject({
      label: "Delivered",
      tone: "green",
    });
    expect(resolveOrdersV7StatusFromStatus("awaiting_shipment")).toMatchObject({
      label: "Awaiting Shipping",
      tone: "purple",
    });
    expect(resolveOrdersV7StatusFromStatus("shipped")).toMatchObject({
      label: "In Progress",
      tone: "purple",
    });
    expect(resolveOrdersV7StatusFromStatus("cancelled")).toMatchObject({
      label: "Cancelled",
      tone: "red",
    });
    expect(resolveOrdersV7StatusFromStatus("issue_open")).toMatchObject({
      label: "Dispute",
      tone: "yellow",
    });
    expect(getOrderStatusLabel("issue_open")).toBe("Dispute");
    expect(getStatusBadgeVariant("completed")).toBe("success");
    expect(getStatusBadgeVariant("cancelled")).toBe("danger");
    expect(getStatusBadgeVariant("awaiting_shipment")).toBe("primary");
  });

  it("maps seller delivered to Protection Hold (purple)", () => {
    const order = {
      status: "delivered",
      refundStatus: "none",
    } as Order;
    expect(resolveOrdersV7Status(order, "seller")).toMatchObject({
      label: "Protection Hold",
      tone: "purple",
    });
    expect(resolveOrdersV7Status(order, "buyer")).toMatchObject({
      label: "Delivered",
      tone: "green",
    });
  });
});
