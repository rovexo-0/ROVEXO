"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@/lib/supabase/types/database";
import { useRole } from "@/features/auth/hooks/use-role";

type RoleGuardProps = {
  allowed: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
};

export function RoleGuard({
  allowed,
  children,
  fallback = null,
  loadingFallback = null,
}: RoleGuardProps) {
  const { role, loading } = useRole();

  if (loading) return loadingFallback;
  if (!role || !allowed.includes(role)) return fallback;

  return children;
}
