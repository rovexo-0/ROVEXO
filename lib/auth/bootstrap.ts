"use client";

import {
  AUTH_MASTER_SPEC,
  type AuthSplashPhase,
} from "@/lib/auth/master-spec";
import { AUTH_ROUTES, AUTH_SPLASH } from "@/lib/auth/canonical";
import { tryCreateClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type SplashBootstrapResult = {
  destination: string;
  authenticated: boolean;
  emailVerified: boolean;
  phases: AuthSplashPhase[];
};

function yieldToPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function welcomeResult(phases: AuthSplashPhase[]): SplashBootstrapResult {
  return {
    destination: AUTH_ROUTES.welcome,
    authenticated: false,
    emailVerified: false,
    phases,
  };
}

export async function resolveSplashDestination(
  onPhase?: (phase: AuthSplashPhase) => void,
): Promise<SplashBootstrapResult> {
  const phases: AuthSplashPhase[] = [];
  const track = (phase: AuthSplashPhase) => {
    phases.push(phase);
    onPhase?.(phase);
  };

  const minDelay = new Promise<void>((resolve) => {
    window.setTimeout(resolve, AUTH_SPLASH.minDisplayMs);
  });

  const sessionPromise = (async (): Promise<SplashBootstrapResult> => {
    track("initialize_app");
    await yieldToPaint();

    track("initialize_supabase");
    if (!isSupabaseConfigured()) {
      return welcomeResult(phases);
    }

    const supabase = tryCreateClient();
    if (!supabase) {
      return welcomeResult(phases);
    }

    track("restore_session");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) {
      return welcomeResult(phases);
    }

    const emailVerified = Boolean(user.email_confirmed_at);
    if (!emailVerified) {
      return {
        destination: `${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(user.email ?? "")}`,
        authenticated: true,
        emailVerified: false,
        phases,
      };
    }

    return {
      destination: AUTH_MASTER_SPEC.splash.destinations.authenticatedVerified,
      authenticated: true,
      emailVerified: true,
      phases,
    };
  })();

  const timeout = new Promise<SplashBootstrapResult>((resolve) => {
    window.setTimeout(() => resolve(welcomeResult([...phases])), AUTH_SPLASH.maxWaitMs);
  });

  const [result] = await Promise.all([Promise.race([sessionPromise, timeout]), minDelay]);

  return result;
}
