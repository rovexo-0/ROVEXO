import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types/database";
import { AUTHENTICATED_HOME } from "@/lib/auth/redirects";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const PROTECTED_PREFIXES = [
  "/account",
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
      const role = await getProfileRole(supabase, user.id);
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
      const role = await getProfileRole(supabase, user.id);
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

    if (user) {
      const role = await getProfileRole(supabase, user.id);

      if (pathname.startsWith("/api/super-admin/") && role !== "super_admin") {
        return forbiddenApiResponse();
      }

      if (
        pathname.startsWith("/api/admin/") &&
        role !== "super_admin" &&
        role !== "admin"
      ) {
        return forbiddenApiResponse();
      }

      if (!isApiRoute && matchesRoutePrefix(pathname, SUPER_ADMIN_ROUTE_PREFIXES)) {
        if (role !== "super_admin") {
          return forbiddenPageRedirect(request, pendingCookies);
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
