import { NextResponse } from "next/server";
import { MFA_TOTP_V1 } from "@/lib/auth/mfa/ssot";
import { readMfaAssurance } from "@/lib/auth/mfa/assurance";
import {
  enrollFriendlyName,
  jsonError,
  purgeUnverifiedTotpFactors,
  requireMfaSessionUser,
} from "@/lib/auth/mfa/server";

export async function POST() {
  const session = await requireMfaSessionUser();
  if (session instanceof NextResponse) return session;

  const assurance = await readMfaAssurance(session.supabase);
  if (assurance.requiresChallenge) {
    return jsonError("Complete MFA challenge before managing enrollment.", 403, "mfa_required");
  }

  if (assurance.verifiedFactorCount > 0) {
    return jsonError("Two-factor authentication is already enabled.", 409, "already_enabled");
  }

  await purgeUnverifiedTotpFactors(session.supabase);

  const { data, error } = await session.supabase.auth.mfa.enroll({
    factorType: MFA_TOTP_V1.factorType,
    friendlyName: enrollFriendlyName(),
  });

  if (error || !data || data.type !== "totp") {
    return jsonError("Unable to start two-factor enrollment.", 500, "enroll_failed");
  }

  // MFA stays disabled until verify-enrollment succeeds.
  return NextResponse.json({
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
    enabled: false,
  });
}
