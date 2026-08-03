import { NextResponse } from "next/server";
import { requireMfaSessionUser, jsonError } from "@/lib/auth/mfa/server";

/** Official Supabase `listFactors` surface for MFA status tooling. */
export async function GET() {
  const session = await requireMfaSessionUser();
  if (session instanceof NextResponse) return session;

  const { data, error } = await session.supabase.auth.mfa.listFactors();
  if (error) {
    return jsonError("Unable to list MFA factors.", 500, "list_factors_failed");
  }

  return NextResponse.json({
    all: data.all,
    totp: data.totp,
    phone: data.phone,
  });
}
