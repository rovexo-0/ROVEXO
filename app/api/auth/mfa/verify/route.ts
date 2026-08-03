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
    factorId: z.string().uuid().optional(),
    challengeId: z.string().uuid().optional(),
    code: z.string().trim().min(6).max(64).optional(),
    recoveryCode: z.string().trim().min(8).max(64).optional(),
  })
  .refine((value) => Boolean(value.code || value.recoveryCode), {
    message: "code_or_recovery_required",
  });

export async function POST(request: Request) {
  const session = await requireMfaSessionUser();
  if (session instanceof NextResponse) return session;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Enter a valid authenticator or recovery code.", 400);
  }

  const assurance = await readMfaAssurance(session.supabase);

  // Recovery code path — one-time, removes MFA factors (re-enroll required).
  if (parsed.data.recoveryCode) {
    const ok = await consumeRecoveryCode(session.user.id, parsed.data.recoveryCode);
    if (!ok) {
      return jsonError("Invalid or used recovery code.", 400, "recovery_invalid");
    }

    try {
      await adminDeleteAllTotpFactors(session.user.id);
      await invalidateAllRecoveryCodes(session.user.id);
    } catch {
      return jsonError("Recovery accepted but MFA cleanup failed. Contact Support.", 500);
    }

    return NextResponse.json({
      verified: true,
      method: "recovery_code",
      mfaDisabled: true,
      reenrollRequired: true,
    });
  }

  const factorId = parsed.data.factorId ?? assurance.verifiedTotpFactorId;
  const challengeId = parsed.data.challengeId;
  const code = parsed.data.code?.replace(/\s+/g, "");

  if (!factorId || !challengeId || !code) {
    return jsonError("MFA challenge verification requires factorId, challengeId, and code.", 400);
  }

  const { data, error } = await session.supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (error || !data) {
    return jsonError("Invalid authenticator code.", 400, "verify_failed");
  }

  return NextResponse.json({
    verified: true,
    method: "totp",
  });
}
