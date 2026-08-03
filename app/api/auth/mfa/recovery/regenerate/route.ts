import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateRecoveryCodes,
  replaceRecoveryCodesForUser,
} from "@/lib/auth/mfa/recovery-codes";
import { readMfaAssurance } from "@/lib/auth/mfa/assurance";
import { jsonError, requireMfaSessionUser } from "@/lib/auth/mfa/server";

const bodySchema = z.object({
  code: z.string().trim().min(6).max(12),
});

export async function POST(request: Request) {
  const session = await requireMfaSessionUser();
  if (session instanceof NextResponse) return session;

  const assurance = await readMfaAssurance(session.supabase);
  if (assurance.requiresChallenge) {
    return jsonError("Complete MFA challenge before regenerating codes.", 403, "mfa_required");
  }
  if (assurance.verifiedFactorCount === 0 || !assurance.verifiedTotpFactorId) {
    return jsonError("Two-factor authentication is not enabled.", 400, "not_enabled");
  }
  if (assurance.currentLevel !== "aal2") {
    return jsonError("AAL2 session required to regenerate recovery codes.", 403, "aal2_required");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Enter a valid authenticator code.", 400);
  }

  const factorId = assurance.verifiedTotpFactorId;
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

  const recoveryCodes = generateRecoveryCodes();
  try {
    await replaceRecoveryCodesForUser(session.user.id, recoveryCodes);
  } catch {
    return jsonError("Unable to store new recovery codes.", 500);
  }

  return NextResponse.json({
    recoveryCodes,
    previousInvalidated: true,
  });
}
