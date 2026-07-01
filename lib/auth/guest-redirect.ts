import "server-only";

import { redirect } from "next/navigation";
import { AUTHENTICATED_HOME, sanitizeNextPath } from "@/lib/auth/redirects";
import { fetchProfileByUserId } from "@/lib/profile/repository";
import { createClient } from "@/lib/supabase/server";

/**
 * Redirect signed-in visitors away from login/register using the Server Component
 * Supabase client (same session context as /account). Middleware must not redirect
 * auth pages — edge vs RSC session desync caused /login ↔ /account loops in production.
 */
export async function redirectIfAuthenticated(next?: string | null): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  if (!user.email_confirmed_at) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email ?? "")}`);
  }

  const profile = await fetchProfileByUserId(user.id);
  if (profile) {
    redirect(sanitizeNextPath(next, AUTHENTICATED_HOME));
  }

  redirect("/auth/signout?error=profile_missing");
}
