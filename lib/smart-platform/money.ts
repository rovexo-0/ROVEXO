/**
 * ROVEXO Global Smart Platform Engine v1.0 — Smart Money Engine.
 * Fail closed when production-active. Never moves money on verification failure.
 */

import { mustUseVirtualWallet } from "@/lib/full-demo/security";
import { isFullDemoEmail } from "@/lib/full-demo/canonical";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { isSmartPlatformProductionActive } from "@/lib/smart-platform/mode";
import { evaluateRovexoVerified } from "@/lib/verified/evaluate";

export type SmartMoneyGateResult = {
  allowed: boolean;
  reason: string | null;
  failClosed: boolean;
};

/**
 * Money must not move when Identity / Verification / Payment / Security /
 * Data Match / Withdraw / KYC / Fraud checks fail — fail closed always (when active).
 *
 * Inactive platform → allow (local / QA / demo / certification SHOW EVERYTHING).
 * Secrets / Stripe env gates remain in wallet stack regardless.
 */
export async function assertSmartMoneyMovement(userId: string): Promise<SmartMoneyGateResult> {
  if (!isSmartPlatformProductionActive()) {
    return { allowed: true, reason: null, failClosed: false };
  }

  if (mustUseVirtualWallet()) {
    const admin = tryCreateAdminClient();
    if (admin) {
      const { data } = await admin.from("profiles").select("email").eq("id", userId).maybeSingle();
      if (isFullDemoEmail(data?.email)) {
        return { allowed: true, reason: null, failClosed: true };
      }
    }
  }

  const evaluation = await evaluateRovexoVerified(userId);
  if (!evaluation.isVerified) {
    return {
      allowed: false,
      reason: evaluation.reason ?? "Money movement blocked — verification failed (fail closed).",
      failClosed: true,
    };
  }

  return { allowed: true, reason: null, failClosed: true };
}
