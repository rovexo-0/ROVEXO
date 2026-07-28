/**
 * Blood XXIV — FINANCIAL_AUDIT_ENGINE
 */

import { calculatePlatformFee, calculateOrderTotals } from "@/lib/orders/pricing";

export type FinancialAuditInput = {
  itemPrice: number;
  shipping: number;
  currency: string;
  platformFee?: number;
};

export type FinancialAuditResult =
  | { ok: true; platformFee: number; total: number }
  | { ok: false; reason: string };

export function FINANCIAL_AUDIT_ENGINE(input: FinancialAuditInput): FinancialAuditResult {
  const itemPrice = Number(input.itemPrice);
  const shipping = Number(input.shipping);
  if (!Number.isFinite(itemPrice) || itemPrice <= 0) {
    return { ok: false, reason: "Invalid item price." };
  }
  if (!Number.isFinite(shipping) || shipping < 0) {
    return { ok: false, reason: "Invalid shipping." };
  }
  if (!input.currency || input.currency.length !== 3) {
    return { ok: false, reason: "Invalid currency." };
  }

  const expectedFee = calculatePlatformFee(itemPrice);
  const totals = calculateOrderTotals(itemPrice, shipping);
  const platformFee = input.platformFee ?? expectedFee;

  if (Math.abs(platformFee - expectedFee) >= 0.001) {
    return { ok: false, reason: "Platform fee mismatch." };
  }
  if (Math.abs(totals.total - (itemPrice + shipping + expectedFee)) >= 0.001) {
    return { ok: false, reason: "Total mismatch." };
  }
  if (Math.abs(totals.platformFee - expectedFee) >= 0.001) {
    return { ok: false, reason: "Protected fee mismatch." };
  }

  return { ok: true, platformFee: expectedFee, total: totals.total };
}
