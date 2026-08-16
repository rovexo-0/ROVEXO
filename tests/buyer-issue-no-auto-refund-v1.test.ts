/**
 * COD SÂNGE — Delivered + "I Have an Issue" must open an issue, never auto-refund.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveTransactionStatusCard } from "@/lib/inbox/transaction-status-card-v1";
import type { Order } from "@/lib/orders/types";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function baseOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord-1",
    orderNumber: "RVXTEST",
    status: "delivered",
    product: {
      id: "p1",
      slug: "item",
      title: "Item",
      price: 10,
      imageUrl: "/placeholder-product.svg",
      condition: "Good",
    },
    buyer: { id: "b1", name: "Buyer" },
    seller: { id: "s1", name: "Seller" },
    totals: { itemPrice: 10, platformFee: 1, delivery: 2, total: 13 },
    deliveryCarrier: "Evri",
    createdAt: new Date().toISOString(),
    disputesDisabled: false,
    ...overrides,
  };
}

describe("A — Delivered + Everything OK → confirmation path", () => {
  it("status card primary is confirm_received (Everything OK)", () => {
    const card = resolveTransactionStatusCard({
      order: baseOrder({ status: "delivered" }),
      viewerRole: "buyer",
    });
    expect(card?.primaryAction?.id).toBe("confirm_received");
    expect(card?.primaryAction?.label).toBe("Everything OK");
  });

  it("confirm_ok still releases payment via existing store path", () => {
    const store = read("lib/orders/store.ts");
    expect(store).toContain('if (action === "confirm_ok")');
    expect(store).toContain("releaseOrderNow");
    expect(store).toContain('status: "completed"');
  });
});

describe("B — Delivered + I Have an Issue → issue flow starts", () => {
  it("status card secondary is report_issue", () => {
    const card = resolveTransactionStatusCard({
      order: baseOrder({ status: "delivered" }),
      viewerRole: "buyer",
    });
    expect(card?.secondaryAction?.id).toBe("report_issue");
    expect(card?.secondaryAction?.label).toBe("I Have an Issue");
  });

  it("report_issue sets issue_open and creates protection case", () => {
    const store = read("lib/orders/store.ts");
    const reportBlock = store.slice(store.indexOf('if (action === "report_issue")'));
    expect(reportBlock).toContain('status: "issue_open"');
    expect(reportBlock).toContain("createProtectionCase");
    expect(reportBlock).toContain('caseType: "dispute"');
  });

  it("issue_open card shows Issue Open for buyer and seller", () => {
    const buyer = resolveTransactionStatusCard({
      order: baseOrder({ status: "issue_open" }),
      viewerRole: "buyer",
    });
    const seller = resolveTransactionStatusCard({
      order: baseOrder({ status: "issue_open" }),
      viewerRole: "seller",
    });
    expect(buyer?.title).toBe("Issue");
    expect(seller?.title).toBe("Issue");
    expect(seller?.title).not.toMatch(/Waiting for buyer confirmation/i);
  });
});

describe("C/D/E — I Have an Issue must not refund / cancel / restock", () => {
  it("report_issue block does not call Stripe refund or inventory release", () => {
    const store = read("lib/orders/store.ts");
    const start = store.indexOf('if (action === "report_issue")');
    const end = store.indexOf("return existing;", start);
    const reportBlock = store.slice(start, end);
    expect(reportBlock).not.toContain("createOrderStripeRefund");
    expect(reportBlock).not.toContain("releaseProductInventory");
    expect(reportBlock).not.toContain('action === "refund"');
    expect(reportBlock).not.toContain("cancelBuyerOrder");
  });

  it("dispute open hook must not immediately processResolutionCase", () => {
    const hooks = read("lib/resolution-engine/hooks.server.ts");
    expect(hooks).toContain("caseType === \"dispute\"");
    expect(hooks).toContain("notifyResolutionUpdate");
    /* After dispute park, processResolutionCase must not run for dispute. */
    const disputePark = hooks.slice(hooks.indexOf("if (caseType === \"dispute\")"));
    const beforeReturn = disputePark.slice(0, disputePark.indexOf("return;"));
    expect(beforeReturn).not.toContain("processResolutionCase");
  });

  it("processor never routes dispute through processReturnCase / auto-refund", () => {
    const processor = read("lib/resolution-engine/processor.ts");
    expect(processor).toContain('case "dispute":');
    expect(processor).toContain("dispute_awaiting_resolution");
    expect(processor).not.toMatch(/case "return":\s*\n\s*case "dispute":/);
    expect(processor).toContain('row.case_type !== "dispute"');
  });

  it("dispute rule is not return_auto_refund", () => {
    const cases = read("lib/resolution-engine/cases.ts");
    expect(cases).toMatch(/dispute:\s*"dispute_awaiting_resolution"/);
    expect(cases).not.toMatch(/dispute:\s*"return_auto_refund"/);
  });
});

describe("F — Repeated issue click idempotent", () => {
  it("createProtectionCase returns existing open/awaiting case", () => {
    const service = read("lib/protection/service.ts");
    expect(service).toContain('["open", "awaiting_seller", "awaiting_buyer", "under_review", "appealed"]');
    expect(service).toContain("existingCase?.id");
    expect(service).toContain("getProtectionCaseByOrderId");
  });

  it("report_issue no-ops when order is no longer delivered", () => {
    const store = read("lib/orders/store.ts");
    const reportBlock = store.slice(store.indexOf('if (action === "report_issue")'));
    expect(reportBlock).toContain('existing.status !== "delivered"');
    expect(reportBlock).toContain("return existing");
  });
});

describe("G — Authorized refund path still exists", () => {
  it("executeAutomaticRefund remains the refund authority", () => {
    const refunds = read("lib/resolution-engine/refunds.ts");
    expect(refunds).toContain("export async function executeAutomaticRefund");
    expect(refunds).toContain("createOrderStripeRefund");
  });

  it("return cases may still auto-process; dispute must not", () => {
    const processor = read("lib/resolution-engine/processor.ts");
    expect(processor).toContain('case "return":');
    expect(processor).toContain("return processReturnCase(caseRow)");
    expect(processor).toContain('case "dispute":');
    expect(processor).toContain("return false");
  });
});
