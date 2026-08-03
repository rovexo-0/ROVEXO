import { NextResponse } from "next/server";
import { z } from "zod";
import { readMfaAssurance } from "@/lib/auth/mfa/assurance";
import { invalidateAllRecoveryCodes } from "@/lib/auth/mfa/recovery-codes";
import { jsonError, requireMfaSessionUser } from "@/lib/auth/mfa/server";

const bodySchema = z.object({
  factorId: z.string().uuid(),
});

/**
 * Official Supabase MFA unenroll for a verified factor.
 * Prefer `/api/auth/mfa/disable` (password + TOTP/recovery) for product disable.
 * This endpoint requires AAL2 and is used after step-up verification.
 */
export async function POST(request: Request) {
  const session = await requireMfaSessionUser();
  if (session instanceof NextResponse) return session;

  const assurance = await readMfaAssurance(session.supabase);
  if (assurance.requiresChallenge || assurance.currentLevel !== "aal2") {
    return jsonError("AAL2 session required to unenroll MFA.", 403, "aal2_required");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("factorId is required.", 400);
  }

  const { error } = await session.supabase.auth.mfa.unenroll({
    factorId: parsed.data.factorId,
  });
  if (error) {
    return jsonError("Unable to unenroll MFA factor.", 400, "unenroll_failed");
  }

  try {
    await invalidateAllRecoveryCodes(session.user.id);
  } catch {
    // Factor removed; recovery cleanup best-effort.
  }

  return NextResponse.json({ unenrolled: true, factorId: parsed.data.factorId });
}
