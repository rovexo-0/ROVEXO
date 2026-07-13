"use client";

import { AUTH_ROUTES, AUTH_SPLASH } from "@/lib/auth/canonical";
import { tryCreateClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type SplashBootstrapResult = {
  destination: string;
  authenticated: boolean;
  emailVerified: boolean;
};

export async function resolveSplashDestination(): Promise<SplashBootstrapResult> {
  const minDelay = new Promise<void>((resolve) => {
    window.setTimeout(resolve, AUTH_SPLASH.minDisplayMs);
  });

  const sessionPromise = (async (): Promise<SplashBootstrapResult> => {
    if (!isSupabaseConfigured()) {
      return {
        destination: AUTH_ROUTES.welcome,
        authenticated: false,
        emailVerified: false,
      };
    }

    const supabase = tryCreateClient();
    if (!supabase) {
      return {
        destination: AUTH_ROUTES.welcome,
        authenticated: false,
        emailVerified: false,
      };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) {
      return {
        destination: AUTH_ROUTES.welcome,
        authenticated: false,
        emailVerified: false,
      };
    }

    const emailVerified = Boolean(user.email_confirmed_at);
    if (!emailVerified) {
      return {
        destination: `${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(user.email ?? "")}`,
        authenticated: true,
        emailVerified: false,
      };
    }

    return {
      destination: AUTH_ROUTES.home,
      authenticated: true,
      emailVerified: true,
    };
  })();

  const timeout = new Promise<SplashBootstrapResult>((resolve) => {
    window.setTimeout(
      () =>
        resolve({
          destination: AUTH_ROUTES.welcome,
          authenticated: false,
          emailVerified: false,
        }),
      AUTH_SPLASH.maxWaitMs,
    );
  });

  const [result] = await Promise.all([
    Promise.race([sessionPromise, timeout]),
    minDelay,
  ]);

  return result;
}
