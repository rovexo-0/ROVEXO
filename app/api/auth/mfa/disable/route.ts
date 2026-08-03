import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeRecoveryCode, invalidateAllRecoveryCodes } from "@/lib/auth/mfa/recovery-codes";
import { readMfaAssurance } from "@/lib/auth/mfa/assurance";
import {
  adminDeleteAllTotpFactors,
  jsonError,
  requireMfaSessionUser,
} from "@/lib/auth/mfa/server";

const bodySchema = z
  .object({
    password: z.string().min(1),
    code: z.string().trim().min(6).max(12).optional(),
    recoveryCode: z.string().trim().min(8).max(64).optional(),
  })
  .refine((value) => Boolean(value.code || value.recoveryCode), {
    message: "totp_or_recovery_required",
  });

export async function POST(request: Request) {
  const session = await requireMfaSessionUser();
  if (session instanceof NextResponse) return session;

  const assurance = await readMfaAssurance(session.supabase);
  if (assurance.requiresChallenge) {
    return jsonError("Complete MFA challenge before disabling 2FA.", 403, "mfa_required");
  }

  if (assurance.verifiedFactorCount === 0) {
    return jsonError("Two-factor authentication is not enabled.", 400, "not_enabled");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Password and authenticator or recovery code are required.", 400);
  }

  const email = session.user.email;
  if (!email) {
    return jsonError("Account email is required to verify password.", 400);
  }

  const { error: passwordError } = await session.supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (passwordError) {
    return jsonError("Current password is incorrect.", 401, "password_invalid");
  }

  if (parsed.data.recoveryCode) {
    const ok = await consumeRecoveryCode(session.user.id, parsed.data.recoveryCode);
    if (!ok) {
      return jsonError("Invalid or used recovery code.", 400, "recovery_invalid");
    }
    try {
      await adminDeleteAllTotpFactors(session.user.id);
      await invalidateAllRecoveryCodes(session.user.id);
    } catch {
      return jsonError("Unable to disable two-factor authentication.", 500);
    }
    return NextResponse.json({ enabled: false, method: "recovery_code" });
  }

  const factorId = assurance.verifiedTotpFactorId;
  if (!factorId || !parsed.data.code) {
    return jsonError("Authenticator code is required.", 400);
  }

  const { data: challenge, error: challengeError } = await session.supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError || !challenge) {
    return jsonError("Unable to create MFA challenge.", 400);
  }

  const { error: verifyError } = await session.supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: parsed.data.code.replace(/\s+/g, ""),
  });
  if (verifyError) {
    return jsonError("Invalid authenticator code.", 400, "verify_failed");
  }

  const { error: unenrollError } = await session.supabase.auth.mfa.unenroll({ factorId });
  if (unenrollError) {
    try {
      await adminDeleteAllTotpFactors(session.user.id);
    } catch {
      return jsonError("Unable to disable two-factor authentication.", 500);
    }
  }

  try {
    await invalidateAllRecoveryCodes(session.user.id);
  } catch {
    // Factors removed; recovery cleanup best-effort.
  }

  return NextResponse.json({ enabled: false, method: "totp" });
}
