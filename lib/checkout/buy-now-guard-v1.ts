/**
 * ROVEXO Blood XXIV — Buy Now BLOOD FIX v1.0 (Root Cause Detection Mode)
 *
 * ABSOLUTE LAW:
 * Buy Now MUST NEVER router.push("/checkout") without:
 * LISTING · BUYER · SELLER · ORDER · TRANSACTION · PAYMENT · FINANCIAL PASSes
 *
 * IF FAIL → STOP · NO PAYMENT · NO ORDER · NO CHECKOUT · NO REDIRECT · NO PRODUCTION PASS
 *
 * SSOT for Buy Now gate. Absolute Financial Law: lib/supreme-blood-code-xxiv-v1.ts
 */

import { ABSOLUTE_FINANCIAL_LAW_V1 } from "@/lib/supreme-blood-code-xxiv-v1";
import { RVX_LOG, RVX_LOG_CODE, type RvxLogPhase } from "@/lib/checkout/rvx-logger-v1";

export const BUY_NOW_BLOOD_FIX_V1 = {
  version: "1.0",
  bloodCode: "XXIV" as const,
  mode: "ROOT_CAUSE_DETECTION" as const,
  status: "IN_DEVELOPMENT" as const,
  forbiddenBlindRedirect: true,
  forbiddenGenericError: "Something went wrong.",
  /** Checkout Guard — 16 checks (Absolute Financial 11 + lock · audit · idempotency · buyer auth · seller accepting) */
  checkoutGuard16Checks: [
    "listingID",
    "buyerID",
    "sellerID",
    "orderID",
    "transactionID",
    "price",
    "platformFee",
    "shipping",
    "currency",
    "checkoutSession",
    "paymentSession",
    "listingLock",
    "financialAudit",
    "idempotency",
    "buyerAuthenticated",
    "sellerAcceptingOrders",
  ] as const,
  buyNowSequence: [
    "listing",
    "buyer",
    "seller",
    "price",
    "shipping",
    "currency",
    "lock",
    "order",
    "transaction",
    "paymentSession",
    "financialAudit",
    "idempotency",
  ] as const,
  forbiddenCheckoutLaws: [
    "BUY_NOW → FAILED → /CHECKOUT → FAILED → PAYMENT → SUCCESS",
    "BUY_NOW → FAILED → ERROR PAGE → Something went wrong.",
    "BUY_NOW → REFRESH → NEW PAYMENT",
    "DOUBLE CLICK → NEW PAYMENT",
    "BACK BUTTON → NEW PAYMENT",
  ] as const,
  ssot: {
    guard: "lib/checkout/buy-now-guard-v1.ts",
    logger: "lib/checkout/rvx-logger-v1.ts",
    api: "app/api/checkout/buy-now/route.ts",
    law: "lib/supreme-blood-code-xxiv-v1.ts",
  } as const,
} as const;

/**
 * Absolute Error Classification Law v1.0 + Invisible Automation UX
 * ONE RVX CODE = ONE ROOT CAUSE (internal only).
 * User NEVER sees RVX codes or validation jargon — only public Sorry copy.
 * Canonical Buy Now codes: RVX-2001…RVX-2012 only.
 */
export const BUY_NOW_RVX_CODES = {
  "RVX-2001": "This item is no longer available.",
  "RVX-2002": "Please sign in to continue.",
  "RVX-2003": "This seller can't accept orders right now.",
  "RVX-2004": "The price has changed. Please try again.",
  "RVX-2005": "Delivery isn't available for this item right now.",
  "RVX-2006": "This currency isn't supported.",
  "RVX-2007": "Sorry, this item is now out of stock.",
  "RVX-2008": "We couldn't start your order. Please try again.",
  "RVX-2009": "We couldn't start your payment. Please try again.",
  "RVX-2010": "Payment isn't ready yet. Please try again.",
  "RVX-2011": "Totals don't match. Please try again.",
  "RVX-2012": "Please wait a moment and try again.",
} as const;

/**
 * Non-canonical unclassified failure — NEVER map unknown errors to RVX-2001…2012.
 * Absolute Law: unknown errors must never become canonical RVX codes.
 */
export const RVX_UNCLASSIFIED = "RVX-2099" as const;
export const RVX_UNCLASSIFIED_MESSAGE =
  "This request could not be completed. Please try again." as const;

/**
 * User-visible only — Absolute UX Law (localhost E2E blood). No RVX. No engines.
 * Dialog chrome (Owner unlock COD SÂNGE): action context + optional Retry + OK
 * via BuyNowPublicErrorDialog — not Sorry+OK-only forced chrome.
 */
export const BUY_NOW_PUBLIC_MESSAGES = {
  itemUnavailable: "Sorry.\nThis item is currently unavailable.",
  outOfStock: "Sorry, this item is now out of stock.",
  sellerUnavailable: "Sorry.\nThe seller is temporarily unavailable.",
  signInRequired: "Sorry.\nPlease sign in to continue.",
  tryAgain: "Sorry.\nSomething went wrong.\nPlease try again.",
} as const;

/** Public error dialog contract — Owner-approved Retry + action context. */
export const BUY_NOW_PUBLIC_ERROR_UX_V1 = {
  id: "buy-now-public-error-ux-v1",
  version: "1.1.0",
  status: "OWNER_APPROVED",
  dialog: "features/checkout/components/BuyNowPublicErrorDialog.tsx",
  actionContext: true,
  retryWhenProvided: true,
  okDismiss: true,
  forbiddenInUi: ["RVX-", "validation failed", "engine", "idempotency", "Checkout blocked"],
} as const;

export type BuyNowPublicMessage =
  (typeof BUY_NOW_PUBLIC_MESSAGES)[keyof typeof BUY_NOW_PUBLIC_MESSAGES];

export type BuyNowRvxCode = keyof typeof BUY_NOW_RVX_CODES;
/** Canonical Buy Now codes + unclassified (never use unclassified as a fake root cause). */
export type RvxClassifiedCode = BuyNowRvxCode | typeof RVX_UNCLASSIFIED;
export type BuyNowGateStep = (typeof BUY_NOW_BLOOD_FIX_V1.buyNowSequence)[number];
export type CheckoutGuard16Check = (typeof BUY_NOW_BLOOD_FIX_V1.checkoutGuard16Checks)[number];

/** Checkout Guard 16 → canonical RVX (first failing check only). */
export const GUARD16_TO_RVX: Record<CheckoutGuard16Check, BuyNowRvxCode> = {
  listingID: "RVX-2001",
  buyerID: "RVX-2002",
  sellerID: "RVX-2003",
  orderID: "RVX-2008",
  transactionID: "RVX-2009",
  price: "RVX-2004",
  platformFee: "RVX-2011",
  shipping: "RVX-2005",
  currency: "RVX-2006",
  checkoutSession: "RVX-2010",
  paymentSession: "RVX-2010",
  listingLock: "RVX-2007",
  financialAudit: "RVX-2011",
  idempotency: "RVX-2012",
  buyerAuthenticated: "RVX-2002",
  sellerAcceptingOrders: "RVX-2003",
};

export type BuyNowGateInput = {
  listing: boolean;
  buyer: boolean;
  seller: boolean;
  price: boolean;
  shipping: boolean;
  currency: boolean;
  lock: boolean;
  order: boolean;
  transaction: boolean;
  paymentSession: boolean;
  financialAudit: boolean;
  idempotency: boolean;
};

export type BuyNowGateResult =
  | { ok: true; code: null; message: null; failedStep: null }
  | {
      ok: false;
      code: BuyNowRvxCode;
      message: string;
      failedStep: BuyNowGateStep;
      userFacing: string;
    };

const STEP_TO_CODE: Record<BuyNowGateStep, BuyNowRvxCode> = {
  listing: "RVX-2001",
  buyer: "RVX-2002",
  seller: "RVX-2003",
  price: "RVX-2004",
  shipping: "RVX-2005",
  currency: "RVX-2006",
  lock: "RVX-2007",
  order: "RVX-2008",
  transaction: "RVX-2009",
  paymentSession: "RVX-2010",
  financialAudit: "RVX-2011",
  idempotency: "RVX-2012",
};

const STEP_PASS_LOG: Record<BuyNowGateStep, RvxLogPhase> = {
  listing: "LISTING PASS",
  buyer: "BUYER PASS",
  seller: "SELLER PASS",
  price: "PRICE PASS",
  shipping: "SHIPPING PASS",
  currency: "CURRENCY PASS",
  lock: "LOCK PASS",
  order: "ORDER PASS",
  transaction: "TRANSACTION PASS",
  paymentSession: "PAYMENT SESSION PASS",
  financialAudit: "FINANCIAL AUDIT PASS",
  idempotency: "IDEMPOTENCY PASS",
};

const STEP_FAIL_LOG: Record<BuyNowGateStep, RvxLogPhase> = {
  listing: "LISTING FAILED",
  buyer: "BUYER FAILED",
  seller: "SELLER FAILED",
  price: "PRICE FAILED",
  shipping: "SHIPPING FAILED",
  currency: "CURRENCY FAILED",
  lock: "LOCK FAILED",
  order: "ORDER FAILED",
  transaction: "TRANSACTION FAILED",
  paymentSession: "PAYMENT SESSION FAILED",
  financialAudit: "FINANCIAL AUDIT FAILED",
  idempotency: "IDEMPOTENCY FAILED",
};

export function getBuyNowErrorMessage(code: BuyNowRvxCode): string {
  return BUY_NOW_RVX_CODES[code];
}

export function isCanonicalBuyNowRvxCode(code: string): code is BuyNowRvxCode {
  return Object.prototype.hasOwnProperty.call(BUY_NOW_RVX_CODES, code);
}

export function isUnclassifiedRvxCode(code: string): code is typeof RVX_UNCLASSIFIED {
  return code === RVX_UNCLASSIFIED;
}

/** Internal / logs / API classification — includes RVX code. Never render in UI. */
export function formatBuyNowUserError(code: RvxClassifiedCode): string {
  if (code === RVX_UNCLASSIFIED) {
    return `${RVX_UNCLASSIFIED}\n${RVX_UNCLASSIFIED_MESSAGE}`;
  }
  return `${code}\n${BUY_NOW_RVX_CODES[code]}`;
}

/**
 * Public UI copy only — Absolute UX Law (message body).
 * Dialog may show actionContext + Retry + OK (BUY_NOW_PUBLIC_ERROR_UX_V1).
 * Forbidden in UI: RVX-*, validation failed, engine names, technical copy.
 */
export function toBuyNowPublicMessage(code: RvxClassifiedCode): BuyNowPublicMessage {
  if (code === "RVX-2002") {
    return BUY_NOW_PUBLIC_MESSAGES.signInRequired;
  }
  if (code === "RVX-2003") {
    return BUY_NOW_PUBLIC_MESSAGES.sellerUnavailable;
  }
  if (code === "RVX-2007") {
    return BUY_NOW_PUBLIC_MESSAGES.outOfStock;
  }
  if (
    code === "RVX-2001" ||
    code === "RVX-2004" ||
    code === "RVX-2005"
  ) {
    return BUY_NOW_PUBLIC_MESSAGES.itemUnavailable;
  }
  return BUY_NOW_PUBLIC_MESSAGES.tryAgain;
}

/** True if a string is unsafe to show the user (RVX / jargon). */
export function containsForbiddenBuyNowUiLeak(message: string): boolean {
  const lower = message.toLowerCase();
  if (/\brvx-\d{4}\b/i.test(message)) return true;
  if (lower.includes("validation")) return true;
  if (lower.includes("audit failed")) return true;
  if (lower.includes("idempotency")) return true;
  if (lower.includes("fraud")) return true;
  if (lower.includes("escrow failed")) return true;
  if (lower.includes("checkout blocked")) return true;
  if (lower.includes("payment blocked")) return true;
  return false;
}

export function isForbiddenBuyNowGenericError(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  // Absolute UX Law allows: "Sorry.\nSomething went wrong.\nPlease try again."
  if (normalized.startsWith("sorry.")) return false;
  return normalized === "something went wrong." || normalized.startsWith("something went wrong");
}

/**
 * BLOOD FIX v1.0 — sequential Buy Now gate.
 * First failure → STOP (no checkout redirect).
 */
export function runBuyNowGuard(input: BuyNowGateInput, options?: { log?: boolean }): BuyNowGateResult {
  const log = options?.log !== false;
  if (log) RVX_LOG("BUY NOW STARTED");

  for (const step of BUY_NOW_BLOOD_FIX_V1.buyNowSequence) {
    if (!input[step]) {
      const code = STEP_TO_CODE[step];
      const message = BUY_NOW_RVX_CODES[code];
      if (log) {
        RVX_LOG(STEP_FAIL_LOG[step]);
        RVX_LOG_CODE(code);
        RVX_LOG("STOP");
        RVX_LOG("CHECKOUT BLOCKED");
        RVX_LOG("PAYMENT BLOCKED");
        RVX_LOG("FINISHED");
      }
      return {
        ok: false,
        code,
        message,
        failedStep: step,
        userFacing: formatBuyNowUserError(code),
      };
    }
    if (log) RVX_LOG(STEP_PASS_LOG[step]);
  }

  if (log) {
    RVX_LOG("SUCCESS");
    RVX_LOG("CHECKOUT ALLOWED");
    RVX_LOG("FINISHED");
  }
  return { ok: true, code: null, message: null, failedStep: null };
}

export function resolveCheckoutGuard16(
  checks: Record<CheckoutGuard16Check, boolean>,
): "ALL_PASSED" | "STOP" {
  return Object.values(checks).every(Boolean) ? "ALL_PASSED" : "STOP";
}

/**
 * Absolute Error Classification — first failing guard16 check → its canonical RVX only.
 * Never collapse all failures to RVX-2011.
 */
export function resolveCheckoutGuard16FailureCode(
  checks: Record<CheckoutGuard16Check, boolean>,
): BuyNowRvxCode {
  for (const key of BUY_NOW_BLOOD_FIX_V1.checkoutGuard16Checks) {
    if (!checks[key]) return GUARD16_TO_RVX[key];
  }
  return "RVX-2012";
}

/** Map Absolute Financial Law display helper when code exists on either table. */
export function resolveFinancialUserError(
  code: RvxClassifiedCode | keyof typeof ABSOLUTE_FINANCIAL_LAW_V1.errorLaw.codes,
): string {
  if (code === RVX_UNCLASSIFIED) {
    return formatBuyNowUserError(RVX_UNCLASSIFIED);
  }
  if (isCanonicalBuyNowRvxCode(code)) {
    return formatBuyNowUserError(code);
  }
  const absolute =
    ABSOLUTE_FINANCIAL_LAW_V1.errorLaw.codes[
      code as keyof typeof ABSOLUTE_FINANCIAL_LAW_V1.errorLaw.codes
    ];
  return `${code}\n${absolute}`;
}
