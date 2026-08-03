import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types/database";
import { AUTH_ERROR_MESSAGES } from "@/lib/auth/redirects";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Clears Supabase auth cookies on the redirect response.
 * Server Component signOut + redirect leaves cookies intact and caused
 * auth ↔ app redirect loops in production.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const error = searchParams.get("error");

  const loginUrl = new URL("/login", origin);
  if (error && Object.prototype.hasOwnProperty.call(AUTH_ERROR_MESSAGES, error)) {
    loginUrl.searchParams.set("error", error);
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(loginUrl);

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });

  await supabase.auth.signOut();

  return response;
}
