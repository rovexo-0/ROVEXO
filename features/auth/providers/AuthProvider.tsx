"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/supabase/types/database";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";
import {
  clearPrivateClientSessionCachesOnLogout,
  preparePrivateClientSessionCachesForAuthHydrate,
} from "@/lib/auth/private-client-session-cache-v1";
import {
  resolveAuthProviderSessionPhase,
  type AuthProviderSessionPhase,
} from "@/lib/auth/auth-provider-session-phase-v1";

export type { AuthProviderSessionPhase };
export { resolveAuthProviderSessionPhase };

export type AuthProfile = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl: string | null;
};

type AuthContextValue = {
  profile: AuthProfile | null;
  loading: boolean;
  error: string | null;
  /** Explicit refresh only (avatar upload / profile edit) — never on navigation. */
  refresh: () => Promise<void>;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_PROFILE_DEFER_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/welcome",
  "/splash",
] as const;

function isAuthProfileDeferredRoute(pathname: string): boolean {
  return AUTH_PROFILE_DEFER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Session-wide cache — survives Soft Nav + provider remounts. undefined = not loaded. */
let cachedProfile: AuthProfile | null | undefined;
let cachedError: string | null = null;
let inflight: Promise<AuthProfile | null> | null = null;

/**
 * Drop stale viewer identity at auth boundaries (sign-out → login → sign-in).
 * Soft-nav preserves this module; without invalidation, listing Owner/Buyer menu
 * compares the previous account id to listing.seller_id and swaps menus.
 */
export function invalidateAuthProfileCache(): void {
  cachedProfile = undefined;
  cachedError = null;
  inflight = null;
}

/**
 * Logout boundary — profile identity + private client caches (saved/badge/bundle).
 * OPT-P0-PERF-07: guest must never inherit prior private UI state.
 */
export function clearClientSessionOnLogout(): void {
  invalidateAuthProfileCache();
  clearPrivateClientSessionCachesOnLogout();
}

async function loadProfileOnce(force = false): Promise<AuthProfile | null> {
  if (!force && cachedProfile !== undefined) {
    return cachedProfile;
  }
  if (!force && inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      const response = await fetch("/api/profile", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        cachedProfile = null;
        cachedError = response.status === 401 ? "Unauthorized" : "Unable to load profile";
        return null;
      }
      const payload = (await response.json()) as { profile: AuthProfile };
      cachedProfile = payload.profile;
      cachedError = null;
      return payload.profile;
    } catch {
      cachedProfile = null;
      cachedError = "Unable to load profile";
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * ONE Auth Owner — /api/profile once per app session (app load).
 * Soft navigation must NOT trigger another network fetch.
 * RC7: defer profile network on auth routes so login LCP is not contended
 * (sign-in still uses server actions — no auth logic change).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const deferProfile = isAuthProfileDeferredRoute(pathname);
  const [profile, setProfile] = useState<AuthProfile | null>(() =>
    cachedProfile === undefined ? null : cachedProfile,
  );
  const [loading, setLoading] = useState(() =>
    deferProfile ? false : cachedProfile === undefined,
  );
  const [error, setError] = useState<string | null>(() => cachedError);
  const [ready, setReady] = useState(() =>
    deferProfile ? true : cachedProfile !== undefined,
  );

  const syncFromCache = useCallback(async (force = false) => {
    if (force) {
      setLoading(true);
    }
    const next = await loadProfileOnce(force);
    setProfile(next);
    setError(cachedError);
    setLoading(false);
    setReady(true);
  }, []);

  useEffect(() => {
    void HEADER_MASTER_FREEZE_V1.oneProfileFetchOnAppLoad;
    let cancelled = false;

    // Auth routes: skip /api/profile network (login LCP). Invalidate stale identity
    // so the next app-route load cannot reuse the previous account's profile.id.
    if (deferProfile) {
      invalidateAuthProfileCache();
      queueMicrotask(() => {
        if (cancelled) return;
        setProfile(null);
        setError(null);
        setLoading(false);
        setReady(true);
      });
      return () => {
        cancelled = true;
      };
    }

    // Leaving auth routes / first app mount: fetch only when identity unknown.
    // OPT-P0-PERF-07: proven GUEST (cachedProfile === null) must not re-hit /api/profile.
    // Soft nav within app keeps deferProfile=false → effect does not re-run → one fetch.
    // Auth routes invalidate to undefined → next platform mount fetches once for session truth.
    void (async () => {
      const next = await loadProfileOnce(false);
      if (cancelled) return;
      if (next) {
        // Login / auth hydrate — drop guest empty-Set / badge TTL before consumers run.
        preparePrivateClientSessionCachesForAuthHydrate();
      }
      setProfile(next);
      setError(cachedError);
      setLoading(false);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [deferProfile]);

  const refresh = useCallback(async () => {
    invalidateAuthProfileCache();
    await syncFromCache(true);
  }, [syncFromCache]);

  const value = useMemo(
    () => ({ profile, loading, error, refresh, ready }),
    [profile, loading, error, refresh, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
