"use client";

import type { ReactNode } from "react";
import { useSuperAdmin } from "@/features/auth/hooks/use-super-admin";

type SuperAdminGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
};

export function SuperAdminGuard({
  children,
  fallback = null,
  loadingFallback = null,
}: SuperAdminGuardProps) {
  const { isSuperAdmin: allowed, loading } = useSuperAdmin();

  if (loading) return loadingFallback;
  if (!allowed) return fallback;

  return children;
}
