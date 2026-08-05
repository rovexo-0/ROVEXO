import "server-only";

import { redirect } from "next/navigation";
import { redirectPathForRole, sanitizeNextPath } from "@/lib/auth/redirects";
import { isInvalidOrExpiredRefreshError } from "@/lib/auth/invalid-refresh-session";
import { fetchProfileByUserId } from "@/lib/profile/repository";
import { createClient } from "@/lib/supabase/server";
import { mfaChallengeHref, readMfaAssurance } from "@/lib/auth/mfa";

/**
 * Redirect signed-in visitors away from login/register using the Server Component
 * Supabase client (same session context as /account). Middleware must not redirect
 * auth pages — edge vs RSC session desync caused /login ↔ /account loops in production.
 *
 * Invalid / expired refresh tokens → clear local session → continue as anonymous (never 500).
 */
export async function redirectIfAuthenticated(next?: string | null): Promise<void> {
  const supabase = await createClient();

  let user = null;
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error && isInvalidOrExpiredRefreshError(error)) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* never surface auth errors on guest pages */
      }
      return;
    }

    if (error || !authUser) {
      return;
    }

    user = authUser;
  } catch (error) {
    if (isInvalidOrExpiredRefreshError(error)) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* never surface auth errors on guest pages */
      }
      return;
    }
    // Unknown failures: still render login as anonymous (fail closed to guest UI).
    console.error("[auth] redirectIfAuthenticated getUser failed:", error);
    return;
  }

  if (!user.email_confirmed_at) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email ?? "")}`);
  }

  const assurance = await readMfaAssurance(supabase);
  if (assurance.requiresChallenge) {
    redirect(mfaChallengeHref(next));
  }

  const profile = await fetchProfileByUserId(user.id);
  if (profile) {
    const destination = next
      ? sanitizeNextPath(next, redirectPathForRole(profile.role))
      : redirectPathForRole(profile.role);
    redirect(destination);
  }

  redirect("/auth/signout?error=profile_missing");
}
