import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DELIVERED_RELEASE_HOURS } from "@/lib/commerce-engine/escrow-constants";
import {
  BUYER_PROTECTION_HOURS,
  platformFeeFromBuyer,
  sellerReceivesFullListingPrice,
  summarizeWalletWithdrawals,
  SELLER_WALLET_COPY,
  walletTransactionCategory,
} from "@/lib/transaction-hub/seller-wallet";
import { PENDING_HOLD_HOURS } from "@/lib/wallet/sales";
import type { WalletTransaction } from "@/lib/wallet/types";

describe("transaction hub seller wallet document 3", () => {
  it("aligns buyer protection with commerce engine hold hours", () => {
    expect(BUYER_PROTECTION_HOURS).toBe(DELIVERED_RELEASE_HOURS);
    expect(BUYER_PROTECTION_HOURS).toBe(24);
    expect(PENDING_HOLD_HOURS).toBe(24);
  });

  it("keeps platform fee on buyer side only", () => {
    expect(sellerReceivesFullListingPrice(100)).toBe(100);
    expect(platformFeeFromBuyer(100)).toBe(5.5);
  });

  it("summarizes withdrawal states", () => {
    const summary = summarizeWalletWithdrawals([
      {
        id: "1",
        orderNumber: "WD-1",
        productTitle: "Withdrawal",
        productImageUrl: "",
        amount: -50,
        status: "completed",
        type: "withdrawal",
        createdAt: "2026-07-01T00:00:00.000Z",
      },
      {
        id: "2",
        orderNumber: "1001",
        productTitle: "Sale",
        productImageUrl: "",
        amount: 80,
        status: "pending",
        type: "sale",
        createdAt: "2026-07-02T00:00:00.000Z",
      },
    ] as WalletTransaction[]);

    expect(summary.completedTotal).toBe(50);
    expect(summary.completedCount).toBe(1);
    expect(walletTransactionCategory({
      id: "2",
      orderNumber: "1001",
      productTitle: "Sale",
      productImageUrl: "",
      amount: 80,
      status: "pending",
      type: "sale",
      createdAt: "2026-07-02T00:00:00.000Z",
    })).toContain("Incoming");
  });

  it("wires seller wallet notifications into escrow and settlement", () => {
    const escrow = readFileSync(
      path.join(process.cwd(), "lib/commerce-engine/escrow.ts"),
      "utf8",
    );
    const settlement = readFileSync(
      path.join(process.cwd(), "lib/commerce-engine/settlement.ts"),
      "utf8",
    );
    const wallet = readFileSync(
      path.join(process.cwd(), "features/wallet/components/WalletHubV1.tsx"),
      "utf8",
    );

    expect(escrow).toContain("notifySellerFundsPending");
    expect(settlement).toContain("notifySellerFundsReleased");
    expect(wallet).toContain("Waiting for delivery");
    expect(wallet).toContain("Being processed");
    expect(wallet).toContain("Paid Out");
    expect(wallet).toContain("Available Balance");
  });

  it("extends super admin finance dashboard metrics", () => {
    const admin = readFileSync(
      path.join(process.cwd(), "features/commerce/components/CommerceEscrowAdmin.tsx"),
      "utf8",
    );
    expect(admin).toContain("Platform fee (today)");
    expect(admin).toContain("Platform fee (week)");
    expect(admin).toContain("Platform fee (month)");
    expect(admin).toContain("Failed withdrawals");
  });
});
