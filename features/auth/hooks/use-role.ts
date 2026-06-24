"use client";

import type { UserRole } from "@/lib/supabase/types/database";
import { useProfile } from "@/features/auth/hooks/use-profile";

export function useRole(): {
  role: UserRole | null;
  loading: boolean;
} {
  const { profile, loading } = useProfile();
  return { role: profile?.role ?? null, loading };
}
