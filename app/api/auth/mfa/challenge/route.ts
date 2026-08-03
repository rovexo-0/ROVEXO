import { NextResponse } from "next/server";
import { resolveVerifiedTotpFactorId, jsonError, requireMfaSessionUser } from "@/lib/auth/mfa/server";
import { readMfaAssurance } from "@/lib/auth/mfa/assurance";

export async function POST() {
  const session = await requireMfaSessionUser();
  if (session instanceof NextResponse) return session;

  const assurance = await readMfaAssurance(session.supabase);
  if (!assurance.requiresChallenge && assurance.currentLevel === "aal2") {
    return NextResponse.json({ alreadyVerified: true, challengeId: null, factorId: assurance.verifiedTotpFactorId });
  }

  const factorId = assurance.verifiedTotpFactorId ?? (await resolveVerifiedTotpFactorId(session.supabase));
  if (!factorId) {
    return jsonError("No verified authenticator factor found.", 400, "no_factor");
  }

  const { data, error } = await session.supabase.auth.mfa.challenge({ factorId });
  if (error || !data) {
    return jsonError("Unable to create MFA challenge.", 400, "challenge_failed");
  }

  return NextResponse.json({
    challengeId: data.id,
    factorId,
    expiresAt: data.expires_at,
  });
}
