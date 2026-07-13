import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/auth/redirects";
import { syncAutoVerifiedProfile } from "@/lib/profile/auto-verified";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const next = sanitizeNextPath(searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as "email" | "magiclink" | "signup" | "invite" | "recovery" | "email_change",
    });

    if (error) {
      const resetNext = sanitizeNextPath(searchParams.get("next"), "/reset-password");
      if (resetNext === "/reset-password") {
        const normalized = error.message.toLowerCase();
        const reason = normalized.includes("expired") ? "expired" : "invalid";
        return NextResponse.redirect(`${origin}/reset-password?error=${reason}`);
      }
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const resetNext = sanitizeNextPath(searchParams.get("next"), "/reset-password");
      if (resetNext === "/reset-password") {
        const normalized = error.message.toLowerCase();
        const reason = normalized.includes("expired") ? "expired" : "invalid";
        return NextResponse.redirect(`${origin}/reset-password?error=${reason}`);
      }
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    await syncAutoVerifiedProfile(user.id);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
