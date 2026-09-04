/**
 * Full Demo Certification — security guards.
 * Demo mode must never touch real Stripe, Sendcloud, or production money paths.
 */

import { isFullDemoEmail } from "@/lib/full-demo/canonical";
import { isVirtualPaymentMode } from "@/lib/launch-certification/demo-payments";
import { isVirtualWalletMode } from "@/lib/launch-certification/demo-wallet";
import { isSendcloudSandboxMode } from "@/lib/launch-certification/certification-mode";

export type FullDemoSecuritySnapshot = {
  virtualPayments: boolean;
  virtualWallet: boolean;
  sendcloudSandbox: boolean;
  realStripeBlocked: boolean;
  realSendcloudBlocked: boolean;
};

/** True when virtual payment path must be used (no Stripe Checkout Session). */
export function mustUseVirtualPayments(): boolean {
  return isVirtualPaymentMode();
}

/** True when Connect transfers must be virtual (no Stripe transfers.create). */
export function mustUseVirtualWallet(): boolean {
  return isVirtualWalletMode();
}

/** True when shipping must use the in-app demo adapter (no Sendcloud HTTP). */
export function mustUseDemoShipping(): boolean {
  // Playwright certification webServer must never hit real Sendcloud.
  if (process.env.PLAYWRIGHT_E2E === "1" || process.env.E2E_TEST === "1") return true;
  // Virtual money paths (Full Demo / cert) never create real carrier labels.
  if (mustUseVirtualPayments()) return true;
  return isSendcloudSandboxMode();
}

/**
 * Full Demo / @demo.rovexo.co.uk actors must never hit real Sendcloud —
 * even when Sendcloud keys exist and virtual env flags are unset.
 */
export function mustUseDemoShippingForActors(
  ...emails: Array<string | null | undefined>
): boolean {
  if (mustUseDemoShipping()) return true;
  return emails.some((email) => isProtectedDemoActor(email));
}

export function assertVirtualPaymentAllowed(
  context: string,
  buyerEmail?: string | null,
): void {
  if (isProtectedDemoActor(buyerEmail)) return;
  if (!mustUseVirtualPayments()) {
    throw new Error(
      `[full-demo] Virtual payment blocked outside certification/virtual mode (${context}).`,
    );
  }
}

export function resolveFullDemoSecuritySnapshot(): FullDemoSecuritySnapshot {
  const virtualPayments = mustUseVirtualPayments();
  const virtualWallet = mustUseVirtualWallet();
  const sendcloudSandbox = mustUseDemoShipping();
  return {
    virtualPayments,
    virtualWallet,
    sendcloudSandbox,
    realStripeBlocked: virtualPayments,
    realSendcloudBlocked: sendcloudSandbox,
  };
}

/** Demo emails never participate in real payment or carrier APIs. */
export function isProtectedDemoActor(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (isFullDemoEmail(normalized)) return true;
  return normalized.endsWith("@demo.rovexo.co.uk");
}

export type CheckoutPaymentRail = "virtual_demo" | "rovexo_balance" | "stripe";

/**
 * Localhost / non-Vercel Stripe TEST card path for Full Demo actors.
 * Never LIVE. Never Production. Enables Checkout Stripe TEST E2E without
 * weakening the virtual rail for wallet / virtual_demo modes.
 */
function isLocalhostStripeTestCardAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  const testKey = process.env.STRIPE_SECRET_KEY_TEST?.trim() || "";
  return testKey.startsWith("sk_test_");
}

/**
 * Payment-method routing — Wallet must never require Stripe readiness.
 * Card / unknown methods stay on the Stripe rail.
 *
 * Gating order (minimal localhost Stripe TEST exception):
 * 1. Full Demo / protected demo + card + localhost + sk_test_ → stripe
 *    (must run BEFORE mustUseVirtualPayments, or cert/virtual env forces virtual_demo)
 * 2. Global virtual payment mode → virtual_demo
 * 3. Wallet → rovexo_balance
 * 4. Other protected demo paths → virtual_demo
 * 5. Default → stripe
 *
 * Never LIVE on localhost. Never Production behavior change
 * (isLocalhostStripeTestCardAllowed is false when NODE_ENV/VERCEL_ENV=production).
 */
export function resolveCheckoutPaymentRail(input?: {
  buyerEmail?: string | null;
  paymentMethod?: string | null;
}): CheckoutPaymentRail {
  // LOCALHOST Stripe TEST card for Full Demo — before global virtual forced mode.
  if (
    input?.paymentMethod === "card" &&
    isProtectedDemoActor(input?.buyerEmail) &&
    isLocalhostStripeTestCardAllowed()
  ) {
    return "stripe";
  }
  if (mustUseVirtualPayments()) return "virtual_demo";
  if (input?.paymentMethod === "rovexo_balance") return "rovexo_balance";
  if (isProtectedDemoActor(input?.buyerEmail)) {
    return "virtual_demo";
  }
  return "stripe";
}

/**
 * Virtual / wallet settlement required — never open real Stripe Checkout.
 * Exception: Full Demo + card + localhost Stripe TEST (see resolveCheckoutPaymentRail).
 */
export function mustSettleWithoutStripe(input?: {
  buyerEmail?: string | null;
  paymentMethod?: string | null;
}): boolean {
  return resolveCheckoutPaymentRail(input) !== "stripe";
}
