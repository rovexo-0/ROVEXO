import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getUserRole,
  requireApiAuth,
  type AuthContext,
} from "@/lib/auth/session";
import { readMiddlewareVerifiedUserState } from "@/lib/auth/middleware-verified-user-v1";
import {
  readBearerAccessToken,
  requestHasSupabaseAuthCookie,
  verifyBearerAccessToken,
} from "@/lib/auth/verify-bearer-access-token-v1";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/supabase/types/database";

const LISTING_ROLES: UserRole[] = [
  "buyer",
  "seller",
  "business",
  "admin",
  "super_admin",
];

/**
 * Saved API auth for cookie browsers and native Bearer sessions.
 * Bearer mutations skip Origin CSRF (OkHttp has no browser Origin).
 * Cookie mutations keep requireApiAuth CSRF. Does not rewrite Auth architecture.
 */

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function authContextFromVerifiedUser(user: User): Promise<AuthContext | NextResponse> {
  const db = tryCreateAdminClient() ?? (await createClient());
  const { data: profile } = await db
    .from("profiles")
    .select("account_status, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_status === "suspended" || profile?.account_status === "deleted") {
    return unauthorized();
  }

  return {
    supabase: await createClient(),
    user,
    role: (profile?.role as UserRole | null) ?? null,
  };
}

async function stampedUserFromMiddleware(): Promise<User | null> {
  try {
    const stamped = await readMiddlewareVerifiedUserState(await headers());
    if (stamped.kind !== "user") return null;
    return {
      id: stamped.user.id,
      aud: "authenticated",
      role: "authenticated",
      email: stamped.user.email ?? undefined,
      email_confirmed_at: stamped.user.emailConfirmedAt ?? undefined,
      phone: "",
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: "",
      updated_at: "",
      is_anonymous: false,
    } as User;
  } catch {
    return null;
  }
}

export async function requireSavedApiAuth(
  request: Request,
): Promise<AuthContext | NextResponse> {
  const token = readBearerAccessToken(request);
  if (token) {
    const user = await verifyBearerAccessToken(token);
    if (!user) {
      return unauthorized();
    }
    return authContextFromVerifiedUser(user);
  }

  // Native Bearer can be verified in middleware then stripped before the
  // Route Handler by Next.js header override. Cookie requests still use
  // requireApiAuth so CSRF stays fail-closed.
  if (!requestHasSupabaseAuthCookie(request)) {
    const stamped = await stampedUserFromMiddleware();
    if (stamped) {
      return authContextFromVerifiedUser(stamped);
    }
  }

  return requireApiAuth(request);
}

/**
 * Same cookie/Bearer helper as Saved, plus listing-role gate.
 * Native OkHttp Publish uses Bearer and must not hit Origin CSRF.
 * Does not create a second auth system.
 */
export async function requireCookieOrBearerListingRole(
  request: Request,
): Promise<(AuthContext & { role: UserRole }) | NextResponse> {
  const auth = await requireSavedApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }
  const role = auth.role ?? (await getUserRole(auth.user.id));
  if (!role || !LISTING_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { ...auth, role };
}
