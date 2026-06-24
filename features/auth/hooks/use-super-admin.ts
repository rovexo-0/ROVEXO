"use client";

import { isSuperAdmin } from "@/lib/auth/roles";
import { useRole } from "@/features/auth/hooks/use-role";

export function useSuperAdmin(): {
  isSuperAdmin: boolean;
  loading: boolean;
} {
  const { role, loading } = useRole();
  return { isSuperAdmin: isSuperAdmin(role), loading };
}
