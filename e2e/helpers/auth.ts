import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Page } from "@playwright/test";
import type { Database } from "../../lib/supabase/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "../../lib/supabase/env";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

const SIGNIN_LOCK_PATH = path.join(process.cwd(), "test-results", ".e2e-auth-signin.lock");
const SIGNIN_MAX_ATTEMPTS = 6;
const SIGNIN_LOCK_WAIT_MS = 120_000;

function isAuthRateLimitError(message: string): boolean {
  return /rate limit/i.test(message);
}

/**
 * Cross-worker lock so parallel Playwright workers do not stampede
 * Supabase password grants (environment rate limits during certify:predeploy).
 */
async function withE2ESignInLock<T>(fn: () => Promise<T>): Promise<T> {
  fs.mkdirSync(path.dirname(SIGNIN_LOCK_PATH), { recursive: true });
  const started = Date.now();
  while (Date.now() - started < SIGNIN_LOCK_WAIT_MS) {
    try {
      const fd = fs.openSync(SIGNIN_LOCK_PATH, "wx");
      try {
        return await fn();
      } finally {
        fs.closeSync(fd);
        try {
          fs.unlinkSync(SIGNIN_LOCK_PATH);
        } catch {
          // ignore race cleanup
        }
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw error;
      await delay(200 + Math.floor(Math.random() * 300));
    }
  }
  throw new Error("E2E sign-in lock timeout — another worker held the auth lock too long.");
}

/**
 * Sign in via Supabase password grant and inject SSR auth cookies into Playwright.
 * Avoids UI login and production rate limits during E2E runs.
 * Retries + serializes only on environment auth rate limits (E2E helper only).
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

  await withE2ESignInLock(async () => {
    let lastMessage = "unknown auth error";
    for (let attempt = 1; attempt <= SIGNIN_MAX_ATTEMPTS; attempt++) {
      const { error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (!error) return;
      lastMessage = error.message;
      if (!isAuthRateLimitError(error.message) || attempt === SIGNIN_MAX_ATTEMPTS) {
        throw new Error(`E2E sign-in failed: ${error.message}`);
      }
      // Backoff only for environment rate limits — does not change production auth.
      await delay(1_500 * attempt);
    }
    throw new Error(`E2E sign-in failed: ${lastMessage}`);
  });

  if (pendingCookies.length === 0) {
    throw new Error("E2E sign-in did not produce any auth cookies.");
  }

  const { hostname } = new URL(input.baseURL);

  const normalizeSameSite = (value: CookieOptions["sameSite"]): "Lax" | "Strict" | "None" => {
    const normalized = String(value ?? "lax").toLowerCase();
    if (normalized === "strict") return "Strict";
    if (normalized === "none") return "None";
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
