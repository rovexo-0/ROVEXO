/**
 * ROVEXO Verified Engine v1.0 — automatic recalculation.
 * Recalculates on profile / payment / bank / business / verification changes.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { isFullDemoEmail } from "@/lib/full-demo/canonical";
import { evaluateRovexoVerified } from "@/lib/verified/evaluate";
import type { RovexoVerifiedEvaluation } from "@/lib/verified/types";

/**
 * Recalculate ROVEXO VERIFIED and persist to profiles.verified (display cache).
 * Fail closed: missing admin → no write; evaluation failure → verified=false.
 */
export async function recalculateRovexoVerified(userId: string): Promise<RovexoVerifiedEvaluation> {
  if (!isSupabaseAdminConfigured()) {
    return {
      version: "v1.0",
      userId,
      path: "personal",
      isVerified: false,
      checks: [],
      failedChecks: [],
      reason: "Verification service unavailable.",
    };
  }

  const evaluation = await evaluateRovexoVerified(userId);
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("email, verified")
    .eq("id", userId)
    .maybeSingle();

  // Full Demo permanent contract.
  if (isFullDemoEmail(profile?.email)) {
    if (profile?.verified !== true) {
      await admin
        .from("profiles")
        .update({ verified: true, account_status: "active" })
        .eq("id", userId);
    }
    return { ...evaluation, isVerified: true, failedChecks: [], reason: null };
  }

  const nextVerified = evaluation.isVerified;
  if (profile?.verified !== nextVerified) {
    await admin.from("profiles").update({ verified: nextVerified }).eq("id", userId);
  }

  return evaluation;
}
