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

function guestResult(phases: AuthSplashPhase[]): SplashBootstrapResult {
  return {
    destination: AUTH_ROUTES.welcome,
    authenticated: false,
    emailVerified: false,
    phases,
  };
}

/**
 * Canonical splash session handler — single entry for cold-start auth routing.
 * Does not expose tokens or internal errors to the UI.
 */
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
      return guestResult(phases);
    }

    const supabase = tryCreateClient();
    if (!supabase) {
      return guestResult(phases);
    }

    track("restore_session");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return guestResult(phases);
      }

      /* Silent refresh / validate — expired or invalid session → local sign-out → guest */
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          /* never surface auth errors on splash */
        }
        return guestResult(phases);
      }

      const user = userData.user;
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
    } catch {
      return guestResult(phases);
    }
  })();

  const timeout = new Promise<SplashBootstrapResult>((resolve) => {
    window.setTimeout(() => resolve(guestResult([...phases])), AUTH_SPLASH.maxWaitMs);
  });

  const [result] = await Promise.all([Promise.race([sessionPromise, timeout]), minDelay]);

  return result;
}
