/**
 * Absolute Error Classification Law v1.0
 * Map order-checkout engine errors → Buy Now / Absolute Financial RVX codes.
 * Never invent. Never return "Something went wrong."
 * Unknown / unmatched errors → RVX-2099 (never RVX-2001…2012).
 */

import {
  formatBuyNowUserError,
  isCanonicalBuyNowRvxCode,
  RVX_UNCLASSIFIED,
  type BuyNowRvxCode,
  type RvxClassifiedCode,
} from "@/lib/checkout/buy-now-guard-v1";

export function mapOrderCheckoutErrorToRvx(raw: string | null | undefined): {
  code: RvxClassifiedCode;
  userFacing: string;
} {
  const text = (raw ?? "").trim();
  const lower = text.toLowerCase();

  // Already classified — preserve canonical codes only.
  const embedded = text.match(/\bRVX-20(?:0[1-9]|1[0-2])\b/);
  if (embedded && isCanonicalBuyNowRvxCode(embedded[0])) {
    return { code: embedded[0], userFacing: formatBuyNowUserError(embedded[0]) };
  }

  let code: RvxClassifiedCode = RVX_UNCLASSIFIED;

  if (!text) {
    code = RVX_UNCLASSIFIED;
  } else if (
    lower.includes("listing unavailable") ||
    lower.includes("product not found") ||
    lower.includes("product is required")
  ) {
    code = "RVX-2001";
  } else if (lower.includes("own listing") || lower.includes("vacation mode")) {
    code = "RVX-2003";
  } else if (lower.includes("offer does not match") || lower.includes("price validation")) {
    code = "RVX-2004";
  } else if (
    lower.includes("unable to retrieve shipping") ||
    lower.includes("shipping price") ||
    lower.includes("shipping unavailable")
  ) {
    code = "RVX-2005";
  } else if (
    lower.includes("unable to reserve") ||
    lower.includes("out of stock") ||
    lower.includes("listing lock")
  ) {
    code = "RVX-2007";
  } else if (
    lower.includes("unable to create order") ||
    lower.includes("order creation failed")
  ) {
    code = "RVX-2008";
  } else if (lower.includes("transaction failed")) {
    code = "RVX-2009";
  } else if (
    lower.includes("payment session") ||
    lower.includes("payments are not configured") ||
    lower.includes("unable to complete virtual payment") ||
    lower.includes("stripe is not configured") ||
    lower.includes("checkout session required") ||
    lower.includes("payment session expired")
  ) {
    code = "RVX-2010";
  } else if (lower.includes("shipping address is required")) {
    code = "RVX-2005";
  } else if (
    lower.includes("financial audit") ||
    lower.includes("platform fee mismatch") ||
    lower.includes("protected fee mismatch") ||
    lower.includes("total mismatch")
  ) {
    code = "RVX-2011";
  } else if (lower.includes("idempoten")) {
    code = "RVX-2012";
  }

  return { code, userFacing: formatBuyNowUserError(code) };
}

/** @deprecated Prefer mapOrderCheckoutErrorToRvx — kept for narrow BuyNowRvxCode callers. */
export function mapOrderCheckoutErrorToCanonicalRvx(
  raw: string | null | undefined,
): { code: BuyNowRvxCode; userFacing: string } | null {
  const mapped = mapOrderCheckoutErrorToRvx(raw);
  if (!isCanonicalBuyNowRvxCode(mapped.code)) return null;
  return { code: mapped.code, userFacing: mapped.userFacing };
}
