import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { decideRelease } from "@/lib/commerce-engine/release-policy";

const ROOT = process.cwd();

function readRepo(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("refunded sale — release / payout fail-closed", () => {
  it("completed + Everything OK does not make a refunded sale releasable", () => {
    expect(
      decideRelease({
        status: "completed",
        deliveredAt: "2026-08-17T16:17:20.137Z",
        hasRefund: true,
        hasOpenClaim: false,
        saleRefunded: true,
        requireTimer: false,
      }),
    ).toBe("sale_refunded");
  });

  it("normal paid + delivered + Everything OK remains eligible", () => {
    expect(
      decideRelease({
        status: "completed",
        deliveredAt: "2026-08-17T16:17:20.137Z",
        hasRefund: false,
        hasOpenClaim: false,
        saleRefunded: false,
        requireTimer: false,
      }),
    ).toBe("released");
  });

  it("settlement resolves sale ledger before release and stops on refunded", () => {
    const settlement = readRepo("lib/commerce-engine/settlement.ts");
    expect(settlement).toContain("loadSellerSaleStatus");
    expect(settlement).toContain('saleStatus === "refunded"');
    expect(settlement).toContain('saleRefunded: saleStatus === "refunded"');
    expect(settlement).toContain('if (sale.status === "refunded")');
    expect(settlement).toContain('reason: "sale_refunded"');
    expect(settlement).toContain("hasBlockingRefund");
    expect(settlement).not.toMatch(/status:\s*"pending"[\s\S]*creditSellerForOrder/);
  });

  it("releaseOrderNow does not select only pending sales and hide a refunded ledger", () => {
    const settlement = readRepo("lib/commerce-engine/settlement.ts");
    const releaseFn = settlement.slice(settlement.indexOf("export async function releaseOrderNow"));
    expect(releaseFn).toContain('.eq("type", "sale")');
    expect(releaseFn).not.toContain('.eq("status", "pending")');
    expect(releaseFn).toContain('sale?.status === "refunded"');
    expect(releaseFn).toContain('reason: "sale_refunded"');
  });

  it("sale credit never recreates a refunded seller sale", () => {
    const sales = readRepo("lib/wallet/sales.ts");
    expect(sales).toContain('existing?.status === "refunded"');
    expect(sales).toContain("if (existing) {");
  });

  it("Stripe Connect payout refuses a refunded sale before transfer", () => {
    const payouts = readRepo("lib/stripe/payouts.ts");
    const transferFn = payouts.slice(
      payouts.indexOf("export async function transferSalePayoutToConnect"),
    );
    const stripeCreate = transferFn.indexOf("stripe.transfers.create");
    const refundedGuard = transferFn.indexOf('saleTx.status === "refunded"');
    expect(refundedGuard).toBeGreaterThan(-1);
    expect(stripeCreate).toBeGreaterThan(refundedGuard);
    expect(transferFn).toContain('error: "sale_refunded"');
  });

  it("reviews stay outside financial settlement", () => {
    const reviews = readRepo("lib/reviews/store.ts");
    expect(reviews).not.toContain("releaseOrderNow");
    expect(reviews).not.toContain("creditSellerForOrder");
    expect(reviews).not.toContain("transferSalePayoutToConnect");
    expect(reviews).not.toContain("openEscrowForOrder");
  });
});
