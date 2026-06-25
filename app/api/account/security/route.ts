import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error) {
    return NextResponse.json({ error: "Unable to load security settings." }, { status: 500 });
  }

  const totpFactors = data.totp.filter((factor) => factor.status === "verified");
  const enabled = totpFactors.length > 0;

  return NextResponse.json({
    mfa: {
      enabled,
      factorCount: totpFactors.length,
    },
  });
}
