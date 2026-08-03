import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/auth/redirects";
import { syncAutoVerifiedProfile } from "@/lib/profile/auto-verified";
import { mfaChallengeHref, readMfaAssurance } from "@/lib/auth/mfa";

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
      const normalized = error.message.toLowerCase();
      let authError = "auth_callback_failed";
      if (
        normalized.includes("already") ||
        normalized.includes("identity") ||
        normalized.includes("registered")
      ) {
        authError = "oauth_account_exists";
      } else if (normalized.includes("expired")) {
        authError = "auth_callback_failed";
      }
      return NextResponse.redirect(`${origin}/login?error=${authError}`);
    }
  } else {
    // Cancel / missing code (IdP cancel often returns error=access_denied).
    const oauthError = searchParams.get("error");
    if (oauthError === "access_denied" || oauthError === "user_cancelled") {
      return NextResponse.redirect(`${origin}/login?error=oauth_cancelled`);
    }
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    await syncAutoVerifiedProfile(user.id);
  }

  // Google/OAuth authentication ≠ 2FA completed. Identical MFA policy to email login.
  if (user?.id) {
    const assurance = await readMfaAssurance(supabase);
    if (assurance.requiresChallenge) {
      return NextResponse.redirect(`${origin}${mfaChallengeHref(next)}`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
