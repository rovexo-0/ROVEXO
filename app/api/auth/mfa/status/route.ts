import { NextResponse } from "next/server";
import {
  countUnusedRecoveryCodes,
} from "@/lib/auth/mfa/recovery-codes";
import { readMfaAssurance } from "@/lib/auth/mfa/assurance";
import { MFA_TOTP_V1 } from "@/lib/auth/mfa/ssot";
import { requireMfaSessionUser } from "@/lib/auth/mfa/server";

export async function GET() {
  const session = await requireMfaSessionUser();
  if (session instanceof NextResponse) return session;

  const assurance = await readMfaAssurance(session.supabase);
  let unusedRecoveryCodes = 0;
  try {
    unusedRecoveryCodes = await countUnusedRecoveryCodes(session.user.id);
  } catch {
    unusedRecoveryCodes = 0;
  }

  return NextResponse.json({
    version: MFA_TOTP_V1.version,
    enabled: assurance.verifiedFactorCount > 0,
    factorCount: assurance.verifiedFactorCount,
    factorId: assurance.verifiedTotpFactorId,
    currentLevel: assurance.currentLevel,
    nextLevel: assurance.nextLevel,
    requiresChallenge: assurance.requiresChallenge,
    unusedRecoveryCodes,
    rememberDeviceEnabled: MFA_TOTP_V1.rememberDeviceEnabled,
  });
}
