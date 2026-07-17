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
  return isSendcloudSandboxMode();
}

export function assertVirtualPaymentAllowed(context: string): void {
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
