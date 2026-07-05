import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types/database";
import { AUTHENTICATED_HOME } from "@/lib/auth/redirects";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

const PROTECTED_PREFIXES = [
  "/account",
  "/buyer",
  "/cart",
  "/orders",
  "/payments",
  "/protection",
  "/wallet",
  "/shipping",
  "/messages",
  "/saved",
  "/notifications",
  "/analytics",
  "/security",
  "/ai",
  "/integrations",
  "/settings",
  "/checkout",
  "/sell",
  "/seller",
  "/import",
  "/business",
  "/admin",
  "/super-admin",
  "/dashboard",
  "/resolution",
];

const SUPER_ADMIN_ROUTE_PREFIXES = [
  "/admin",
  "/super-admin",
  "/dashboard",
  "/staff",
];

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
  let supabaseResponse = NextResponse.next({ request });
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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    if (pathname.startsWith("/auctions/") && pathname !== "/auctions") {
      const auctionsUrl = request.nextUrl.clone();
      auctionsUrl.pathname = "/auctions";
      auctionsUrl.search = "";
      return applyPendingCookies(NextResponse.redirect(auctionsUrl), pendingCookies);
    }

    const isProtected = PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    const isVerifyEmailPath =
      pathname === "/verify-email" || pathname.startsWith("/verify-email/");
    const isResetPasswordPath =
      pathname === "/reset-password" || pathname.startsWith("/reset-password/");
    const isApiRoute = pathname.startsWith("/api/");
    const isAuthBypass = AUTH_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (isAuthBypass) {
      return applyPendingCookies(supabaseResponse, pendingCookies);
    }

    if (!user && isProtected && !isApiRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
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
      const role = await resolveRole();
      if (role) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = AUTHENTICATED_HOME;
        homeUrl.search = "";
        return applyPendingCookies(NextResponse.redirect(homeUrl), pendingCookies);
      }
      return applyPendingCookies(supabaseResponse, pendingCookies);
    }

    if (!user && isResetPasswordPath) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", "/reset-password");
      loginUrl.searchParams.set("error", "reset_session_required");
      return applyPendingCookies(NextResponse.redirect(loginUrl), pendingCookies);
    }

    // Only resolve the role for admin-scoped paths. Ordinary authenticated
    // navigations (homepage, most API routes) must not pay for a role query here.
    if (user) {
      const isSuperAdminApi = pathname.startsWith("/api/super-admin/");
      const isAdminApi = pathname.startsWith("/api/admin/");
      const isStaffApi = pathname.startsWith("/api/staff-enterprise/");
      const isStaffPage = !isApiRoute && (pathname === "/staff" || pathname.startsWith("/staff/"));
      const isSuperAdminPage =
        !isApiRoute && matchesRoutePrefix(pathname, SUPER_ADMIN_ROUTE_PREFIXES);

      if (isSuperAdminApi || isAdminApi || isSuperAdminPage || isStaffApi || isStaffPage) {
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
    console.error("[middleware] session update failed:", error);
    return applyPendingCookies(supabaseResponse, pendingCookies);
  }
}
