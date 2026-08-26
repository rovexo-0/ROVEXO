import { createServerClient } from "@supabase/ssr";
import { createClient as createAuthClient, type User } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types/database";

/**
 * Canonical Native Bearer JWT verification.
 * One path: Authorization Bearer → supabase.auth.getUser(accessToken).
 * Used by cookie-or-Bearer API auth. Does not trust unverified JWT claims.
 * Does not replace cookie Auth. Does not return a service-role client.
 */

export function readBearerAccessToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(\S+)/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token || null;
}

export function requestHasSupabaseAuthCookie(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").some((part) => part.trim().includes("-auth-token"));
}

export async function verifyBearerAccessToken(accessToken: string): Promise<User | null> {
  if (!accessToken.trim()) return null;
  const supabase = createAuthClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user?.id) return null;
  return data.user;
}

/**
 * Least-privilege Supabase client for an already-verified Bearer user.
 * Sends the user JWT so RLS applies. Never uses the service-role key.
 */
export function createVerifiedBearerUserClient(accessToken: string) {
  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
