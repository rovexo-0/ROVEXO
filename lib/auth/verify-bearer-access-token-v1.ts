import { createClient as createAuthClient, type User } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Canonical Native Bearer JWT verification.
 * One path: Authorization Bearer → supabase.auth.getUser(accessToken).
 * Used by Saved/Listings auth and by middleware stamping.
 * Does not trust unverified JWT claims. Does not replace cookie Auth.
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

/** Keep Authorization on the middleware override list so Route Handlers still see it. */
export function preserveAuthorizationHeader(from: Headers, to: Headers): void {
  const authorization = from.get("authorization");
  if (authorization) {
    to.set("authorization", authorization);
  }
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
