"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserRole } from "@/lib/supabase/types/database";

export type ClientProfile = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl: string | null;
};

type ProfileState = {
  profile: ClientProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useProfile(): ProfileState {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        credentials: "same-origin",
        signal,
      });
      if (signal?.aborted) return;
      if (!response.ok) {
        setProfile(null);
        setError(response.status === 401 ? "Unauthorized" : "Unable to load profile");
        return;
      }

      const payload = (await response.json()) as { profile: ClientProfile };
      if (signal?.aborted) return;
      setProfile(payload.profile);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setProfile(null);
      setError("Unable to load profile");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void refresh(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [refresh]);

  return { profile, loading, error, refresh };
}
