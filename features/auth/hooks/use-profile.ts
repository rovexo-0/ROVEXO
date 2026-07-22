"use client";

import { useAuthOptional, type AuthProfile } from "@/features/auth/providers/AuthProvider";
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

function toClientProfile(profile: AuthProfile | null): ClientProfile | null {
  return profile;
}

/**
 * Profile hook — uses ONE AuthProvider store when available (no second fetch).
 */
export function useProfile(): ProfileState {
  const auth = useAuthOptional();

  if (auth) {
    return {
      profile: toClientProfile(auth.profile),
      loading: auth.loading,
      error: auth.error,
      refresh: auth.refresh,
    };
  }

  // Outside AuthProvider (should not happen in app shell).
  return {
    profile: null,
    loading: false,
    error: "AuthProvider missing",
    refresh: async () => undefined,
  };
}
