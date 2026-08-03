import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateRecoveryCodes,
  replaceRecoveryCodesForUser,
} from "@/lib/auth/mfa/recovery-codes";
import { jsonError, requireMfaSessionUser } from "@/lib/auth/mfa/server";

const bodySchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().trim().min(6).max(12),
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
    return jsonError("Enter a valid authenticator code.", 400);
  }

  const { factorId, code } = parsed.data;

  const { data: challenge, error: challengeError } = await session.supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError || !challenge) {
    return jsonError("Unable to create MFA challenge.", 400, "challenge_failed");
  }

  const { data: verified, error: verifyError } = await session.supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: code.replace(/\s+/g, ""),
  });

  if (verifyError || !verified) {
    return jsonError("Invalid authenticator code. MFA remains disabled.", 400, "verify_failed");
  }

  const recoveryCodes = generateRecoveryCodes();
  try {
    await replaceRecoveryCodesForUser(session.user.id, recoveryCodes);
  } catch {
    return jsonError(
      "Authenticator verified but recovery codes could not be stored. Contact Support.",
      500,
      "recovery_store_failed",
    );
  }

  return NextResponse.json({
    enabled: true,
    recoveryCodes,
  });
}
