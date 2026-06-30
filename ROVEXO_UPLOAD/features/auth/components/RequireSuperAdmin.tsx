"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSuperAdmin } from "@/features/auth/hooks/use-super-admin";

type RequireSuperAdminProps = {
  children: ReactNode;
  redirectTo?: string;
  loadingFallback?: ReactNode;
};

/**
 * Client-side guard — redirects non–super-admins away from protected UI.
 * Server layouts and middleware remain the source of truth for authorization.
 */
export function RequireSuperAdmin({
  children,
  redirectTo = "/403",
  loadingFallback = null,
}: RequireSuperAdminProps) {
  const router = useRouter();
  const { isSuperAdmin: allowed, loading } = useSuperAdmin();

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace(redirectTo);
    }
  }, [allowed, loading, redirectTo, router]);

  if (loading) return loadingFallback;
  if (!allowed) return null;

  return children;
}
