"use client";

import {
  AUTH_MASTER_SPEC,
  type AuthSplashPhase,
} from "@/lib/auth/master-spec";
import { AUTH_ROUTES, AUTH_STARTUP } from "@/lib/auth/canonical";
import { tryCreateClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type SplashBootstrapResult = {
  destination: string;
  authenticated: boolean;
  emailVerified: boolean;
  phases: AuthSplashPhase[];
};

/**
 * Session bootstrap for cold start — Splash UI removed.
 * Guest → Login · Verified session → Homepage · Unverified → verify-email.
 */
export async function resolveSplashDestination(
  onPhase?: (phase: AuthSplashPhase) => void,
): Promise<SplashBootstrapResult> {
  const phases: AuthSplashPhase[] = [];
  const track = (phase: AuthSplashPhase) => {
    phases.push(phase);
    onPhase?.(phase);
  };

  track("initialize_app");
  track("initialize_supabase");

  if (!isSupabaseConfigured()) {
    return {
      destination: AUTH_STARTUP.guestEntry,
      authenticated: false,
      emailVerified: false,
      phases,
    };
  }

  const supabase = tryCreateClient();
  if (!supabase) {
    return {
      destination: AUTH_STARTUP.guestEntry,
      authenticated: false,
      emailVerified: false,
      phases,
    };
  }

  track("restore_session");

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return {
        destination: AUTH_STARTUP.guestEntry,
        authenticated: false,
        emailVerified: false,
        phases,
      };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* never surface auth errors */
      }
      return {
        destination: AUTH_STARTUP.guestEntry,
        authenticated: false,
        emailVerified: false,
        phases,
      };
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
      destination: AUTH_MASTER_SPEC.startup.authenticatedHome,
      authenticated: true,
      emailVerified: true,
      phases,
    };
  } catch {
    return {
      destination: AUTH_STARTUP.guestEntry,
      authenticated: false,
      emailVerified: false,
      phases,
    };
  }
}
