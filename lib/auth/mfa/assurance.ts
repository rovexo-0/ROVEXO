import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type MfaAssuranceSnapshot = {
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  verifiedTotpFactorId: string | null;
  verifiedFactorCount: number;
  /** True when password/OAuth succeeded but TOTP challenge is still required. */
  requiresChallenge: boolean;
};

type AuthClient = Pick<SupabaseClient, "auth">;

/**
 * Resolve whether the active session must complete a TOTP challenge before
 * entering the application. Uses official Supabase MFA AAL + listFactors.
 */
export async function readMfaAssurance(supabase: AuthClient): Promise<MfaAssuranceSnapshot> {
  const [{ data: aalData }, { data: factorsData }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  const verifiedTotp = (factorsData?.totp ?? []).filter((factor) => factor.status === "verified");
  const verifiedTotpFactorId = verifiedTotp[0]?.id ?? null;
  const currentLevel = (aalData?.currentLevel ?? null) as MfaAssuranceSnapshot["currentLevel"];
  const nextLevel = (aalData?.nextLevel ?? null) as MfaAssuranceSnapshot["nextLevel"];

  const requiresChallenge =
    verifiedTotp.length > 0 && currentLevel === "aal1" && nextLevel === "aal2";

  return {
    currentLevel,
    nextLevel,
    verifiedTotpFactorId,
    verifiedFactorCount: verifiedTotp.length,
    requiresChallenge,
  };
}
