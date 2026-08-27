import "server-only";

import { NextResponse } from "next/server";
import { getAuthContext, requireApiAuth, type AuthContext } from "@/lib/auth/session";
import {
  createVerifiedBearerUserClient,
  readBearerAccessToken,
  verifyBearerAccessToken,
} from "@/lib/auth/verify-bearer-access-token-v1";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/supabase/types/database";

/**
 * Canonical cookie + Native Bearer API auth.
 * Cookie mutations keep requireApiAuth Origin CSRF.
 * Verified Bearer mutations may receive the native CSRF exemption in csrf-guard.
 * Invalid Bearer never falls through to cookie identity.
 * Does not rewrite Auth architecture. Does not parse JWT locally.
 * One verifier: verifyBearerAccessToken. AuthContext is never service-role.
 */

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function authContextFromVerifiedBearerUser(
  user: User,
  accessToken: string,
): Promise<AuthContext | NextResponse> {
  const db = createVerifiedBearerUserClient(accessToken);
  const { data: profile } = await db
    .from("profiles")
    .select("account_status, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_status === "suspended" || profile?.account_status === "deleted") {
    return unauthorized();
  }

  return {
    supabase: db,
    user,
    role: (profile?.role as UserRole | null) ?? null,
  };
}

export async function requireCookieOrBearerApiAuth(
  request: Request,
): Promise<AuthContext | NextResponse> {
  const token = readBearerAccessToken(request);
  if (token) {
    const user = await verifyBearerAccessToken(token);
    if (!user) {
      return unauthorized();
    }
    return authContextFromVerifiedBearerUser(user, token);
  }

  return requireApiAuth(request);
}

/** Public reads: cookie or Native Bearer when present. Never 401 for guests. */
export async function optionalCookieOrBearerApiAuth(
  request: Request,
): Promise<AuthContext | null> {
  const token = readBearerAccessToken(request);
  if (token) {
    const user = await verifyBearerAccessToken(token);
    if (!user) return null;
    const context = await authContextFromVerifiedBearerUser(user, token);
    return context instanceof NextResponse ? null : context;
  }
  return getAuthContext().catch(() => null);
}
