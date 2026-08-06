import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import { AUTHENTICATED_HOME, sanitizeNextPath } from "@/lib/auth/redirects";
import {
  AUTH_PROTECTED_PREFIXES,
  AUTH_ADMIN_PREFIXES,
  AUTH_SUPER_ADMIN_PREFIXES,
} from "@/lib/auth/protected-routes";
import { isInvalidOrExpiredRefreshError } from "@/lib/auth/invalid-refresh-session";
import { ROVEXO_PATHNAME_HEADER } from "@/lib/auth/request-pathname";
import { enforceApiPerimeterSecurity } from "@/lib/api/api-perimeter-security-v1";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";
import { isMfaPendingAllowedPath, MFA_TOTP_V1 } from "@/lib/auth/mfa/ssot";

const AUTH_BYPASS_PREFIXES = ["/auth/callback", "/auth/signout"];

type UserRole = Database["public"]["Enums"]["user_role"];

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function applyPendingCookies(response: NextResponse, pendingCookies: PendingCookie[]) {
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

/** Passthrough that stamps the request pathname for root loading boundaries. */
function nextWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(ROVEXO_PATHNAME_HEADER, request.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function matchesRoutePrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function getProfileRole(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
): Promise<UserRole | null> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role ?? null;
}

function forbiddenPageRedirect(request: NextRequest, pendingCookies: PendingCookie[]) {
  const forbiddenUrl = request.nextUrl.clone();
  forbiddenUrl.pathname = "/403";
  forbiddenUrl.search = "";
  return applyPendingCookies(NextResponse.redirect(forbiddenUrl), pendingCookies);
}

function forbiddenApiResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = nextWithPathname(request);
  let pendingCookies: PendingCookie[] = [];

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies = cookiesToSet;
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = nextWithPathname(request);
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    let user: User | null = null;

    try {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError && isInvalidOrExpiredRefreshError(userError)) {
        // Clear dead refresh cookies so /login and guests never loop or 500.
        await supabase.auth.signOut({ scope: "local" });
        user = null;
      } else {
        user = authUser;
      }
    } catch (authError) {
      if (isInvalidOrExpiredRefreshError(authError)) {
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          /* cookies may already be unusable */
        }
        user = null;
      } else {
        throw authError;
      }
    }

    // Resolve the profile role at most once per request. Several checks below
    // need it; previously each issued its own profiles query, adding a
    // redundant round-trip on every protected navigation.
    let cachedRole: UserRole | null | undefined;
    const resolveRole = async (): Promise<UserRole | null> => {
      if (cachedRole === undefined) {
        cachedRole = user ? await getProfileRole(supabase, user.id) : null;
      }
      return cachedRole;
    };

    const pathname = request.nextUrl.pathname;

    // P11.2 — API perimeter: sensitive rate limits + CSRF Origin (webhooks/cron exempt).
    if (pathname.startsWith("/api/")) {
      const perimeterBlock = await enforceApiPerimeterSecurity(request);
      if (perimeterBlock) {
        return perimeterBlock;
      }
    }

    // Removed startup routes — always redirect away from Splash / Welcome.
    if (pathname === "/splash" || pathname.startsWith("/splash/") || pathname === "/welcome" || pathname.startsWith("/welcome/")) {
      const target = request.nextUrl.clone();
      if (user) {
        target.pathname = user.email_confirmed_at ? AUTHENTICATED_HOME : "/verify-email";
        target.search = user.email_confirmed_at ? "" : `?email=${encodeURIComponent(user.email ?? "")}`;
      } else {
        target.pathname = "/login";
        target.search = "";
      }
      return applyPendingCookies(NextResponse.redirect(target), pendingCookies);
    }

    // Cold start: logged-out users opening the app land on Login (not Homepage).
    if (!user && (pathname === "/" || pathname === "")) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      return applyPendingCookies(NextResponse.redirect(loginUrl), pendingCookies);
    }

    if (pathname.startsWith("/auctions/") && pathname !== "/auctions") {
      const auctionsUrl = request.nextUrl.clone();
      auctionsUrl.pathname = "/auctions";
      auctionsUrl.search = "";
      return applyPendingCookies(NextResponse.redirect(auctionsUrl), pendingCookies);
    }

    const isProtected = AUTH_PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    const isVerifyEmailPath =
      pathname === "/verify-email" || pathname.startsWith("/verify-email/");
    const isApiRoute = pathname.startsWith("/api/");
    const isAuthBypass = AUTH_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (isAuthBypass) {
      return applyPendingCookies(supabaseResponse, pendingCookies);
    }

    // MFA enforcement: AAL1 sessions with verified TOTP must complete challenge
    // before entering the application. Refresh tokens alone cannot bypass this.
    if (user) {
      const onMfaAllowlist = isMfaPendingAllowedPath(pathname);
      if (!onMfaAllowlist) {
        try {
          const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
            if (isApiRoute) {
              return NextResponse.json(
                { error: "MFA challenge required.", code: "mfa_required" },
                { status: 403 },
              );
            }
            const mfaUrl = request.nextUrl.clone();
            mfaUrl.pathname = MFA_TOTP_V1.challengePath;
            mfaUrl.search = "";
            const nextPath = sanitizeNextPath(`${pathname}${request.nextUrl.search || ""}`);
            if (nextPath !== "/") {
              mfaUrl.searchParams.set("next", nextPath);
            }
            return applyPendingCookies(NextResponse.redirect(mfaUrl), pendingCookies);
          }
        } catch (mfaError) {
          // Fail closed: never allow app entry when assurance cannot be verified.
          console.error("[middleware] MFA assurance check failed:", mfaError);
          if (isApiRoute) {
            return NextResponse.json(
              { error: "MFA challenge required.", code: "mfa_required" },
              { status: 403 },
            );
          }
          const mfaUrl = request.nextUrl.clone();
          mfaUrl.pathname = MFA_TOTP_V1.challengePath;
          mfaUrl.search = "";
          return applyPendingCookies(NextResponse.redirect(mfaUrl), pendingCookies);
        }
      }
    }

    if (!user && isProtected && !isApiRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", pathname);
      return applyPendingCookies(NextResponse.redirect(loginUrl), pendingCookies);
    }

    if (user && !user.email_confirmed_at && isProtected && !isApiRoute) {
      const verifyUrl = request.nextUrl.clone();
      verifyUrl.pathname = "/verify-email";
      verifyUrl.searchParams.set("email", user.email ?? "");
      return applyPendingCookies(NextResponse.redirect(verifyUrl), pendingCookies);
    }

    if (user && isProtected && !isApiRoute) {
      const role = await resolveRole();
      if (!role) {
        const signoutUrl = request.nextUrl.clone();
        signoutUrl.pathname = "/auth/signout";
        signoutUrl.search = "";
        signoutUrl.searchParams.set("error", "profile_missing");
        return applyPendingCookies(NextResponse.redirect(signoutUrl), pendingCookies);
      }
    }

    // /login and /register are never redirected here — see redirectIfAuthenticated().

    if (user && isVerifyEmailPath && user.email_confirmed_at) {
      // Allow branded success / in-flight token UX (Email Verification UX v1.0).
      const verifyStatus = request.nextUrl.searchParams.get("status");
      const hasVerifyToken =
        Boolean(request.nextUrl.searchParams.get("token_hash")) ||
        Boolean(request.nextUrl.searchParams.get("code"));
      if (
        verifyStatus === "success" ||
        verifyStatus === "verified" ||
        hasVerifyToken
      ) {
        return applyPendingCookies(supabaseResponse, pendingCookies);
      }
      const role = await resolveRole();
      if (role) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = AUTHENTICATED_HOME;
        homeUrl.search = "";
        return applyPendingCookies(NextResponse.redirect(homeUrl), pendingCookies);
      }
      return applyPendingCookies(supabaseResponse, pendingCookies);
    }

    // Only resolve the role for admin-scoped paths. Ordinary authenticated
    // navigations (homepage, most API routes) must not pay for a role query here.
    if (user) {
      const isSuperAdminApi =
        pathname.startsWith("/api/super-admin/") || pathname.startsWith("/api/marketplace-os/");
      const isAdminApi = pathname.startsWith("/api/admin/");
      const isStaffApi = pathname.startsWith("/api/staff-enterprise/");
      const isStaffPage = !isApiRoute && (pathname === "/staff" || pathname.startsWith("/staff/"));
      const isSuperAdminPage =
        !isApiRoute && matchesRoutePrefix(pathname, [...AUTH_SUPER_ADMIN_PREFIXES]);
      const isAdminPage =
        !isApiRoute && matchesRoutePrefix(pathname, [...AUTH_ADMIN_PREFIXES]);

      if (
        isSuperAdminApi ||
        isAdminApi ||
        isSuperAdminPage ||
        isAdminPage ||
        isStaffApi ||
        isStaffPage
      ) {
        const role = await resolveRole();

        if (isSuperAdminApi && role !== "super_admin") {
          return forbiddenApiResponse();
        }

        if (isAdminApi && role !== "super_admin" && role !== "admin") {
          return forbiddenApiResponse();
        }

        if (isSuperAdminPage && role !== "super_admin") {
          return forbiddenPageRedirect(request, pendingCookies);
        }

        if (isAdminPage && role !== "super_admin" && role !== "admin") {
          return forbiddenPageRedirect(request, pendingCookies);
        }

        if (isStaffApi || isStaffPage) {
          if (role === "super_admin") {
            return applyPendingCookies(supabaseResponse, pendingCookies);
          }

          const admin = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
            cookies: {
              getAll: () => request.cookies.getAll(),
              setAll: () => undefined,
            },
          });

          const { data: staffProfile } = await admin
            .from("staff_profiles" as never)
            .select("id, status")
            .eq("profile_id", user.id)
            .maybeSingle();

          const staff = staffProfile as { id: string; status: string } | null;
          if (!staff || staff.status !== "active") {
            if (isStaffApi) return forbiddenApiResponse();
            return forbiddenPageRedirect(request, pendingCookies);
          }
        }
      }
    }

    return applyPendingCookies(supabaseResponse, pendingCookies);
  } catch (error) {
    // Never redirect from the error path — a stale session cookie plus a failed
    // Supabase refresh caused /login ↔ /dashboard infinite redirect loops in production.
    // Invalid refresh → strip auth cookies and continue as anonymous (HTTP 200).
    if (isInvalidOrExpiredRefreshError(error)) {
      try {
        const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              pendingCookies = cookiesToSet;
              cookiesToSet.forEach(({ name, value }) => {
                request.cookies.set(name, value);
              });
              supabaseResponse = nextWithPathname(request);
              cookiesToSet.forEach(({ name, value, options }) => {
                supabaseResponse.cookies.set(name, value, options);
              });
            },
          },
        });
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* continue anonymous */
      }
      return applyPendingCookies(supabaseResponse, pendingCookies);
    }
    console.error("[middleware] session update failed:", error);
    return applyPendingCookies(supabaseResponse, pendingCookies);
  }
}
