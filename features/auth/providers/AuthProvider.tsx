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
import type { UserRole } from "@/lib/supabase/types/database";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";

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

/** Session-wide cache — survives Soft Nav + provider remounts. undefined = not loaded. */
let cachedProfile: AuthProfile | null | undefined;
let cachedError: string | null = null;
let inflight: Promise<AuthProfile | null> | null = null;

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
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(() =>
    cachedProfile === undefined ? null : cachedProfile,
  );
  const [loading, setLoading] = useState(() => cachedProfile === undefined);
  const [error, setError] = useState<string | null>(() => cachedError);
  const [ready, setReady] = useState(() => cachedProfile !== undefined);

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
    // All setState runs after await — never synchronously inside the effect body.
    void (async () => {
      const next = await loadProfileOnce(false);
      if (cancelled) return;
      setProfile(next);
      setError(cachedError);
      setLoading(false);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    cachedProfile = undefined;
    cachedError = null;
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
