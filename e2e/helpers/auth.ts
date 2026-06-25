import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Page } from "@playwright/test";
import type { Database } from "../../lib/supabase/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "../../lib/supabase/env";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Sign in via Supabase password grant and inject SSR auth cookies into Playwright.
 * Avoids UI login and production rate limits during E2E runs.
 */
export async function signInWithSessionCookies(
  page: Page,
  input: { email: string; password: string; baseURL: string },
): Promise<void> {
  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return pendingCookies.map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          const existingIndex = pendingCookies.findIndex((entry) => entry.name === cookie.name);
          if (existingIndex >= 0) {
            pendingCookies[existingIndex] = cookie;
          } else {
            pendingCookies.push(cookie);
          }
        }
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw new Error(`E2E sign-in failed: ${error.message}`);
  }

  if (pendingCookies.length === 0) {
    throw new Error("E2E sign-in did not produce any auth cookies.");
  }

  const { hostname } = new URL(input.baseURL);

  const normalizeSameSite = (value: CookieOptions["sameSite"]): "Lax" | "Strict" | "None" => {
    if (value === "strict" || value === "Strict") return "Strict";
    if (value === "none" || value === "None") return "None";
    return "Lax";
  };

  await page.context().addCookies(
    pendingCookies.map(({ name, value, options }) => ({
      name,
      value,
      domain: hostname,
      path: options.path ?? "/",
      httpOnly: options.httpOnly ?? true,
      secure: options.secure ?? false,
      sameSite: normalizeSameSite(options.sameSite),
      expires: options.maxAge ? Math.floor(Date.now() / 1000) + options.maxAge : undefined,
    })),
  );
}
