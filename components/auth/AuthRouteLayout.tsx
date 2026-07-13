"use client";

import { usePathname } from "next/navigation";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AUTH_ROUTES } from "@/lib/auth/canonical";

type AuthRouteLayoutProps = {
  children: React.ReactNode;
};

/** Splash is full-bleed; all other auth routes use the shared shell. */
export function AuthRouteLayout({ children }: AuthRouteLayoutProps) {
  const pathname = usePathname();

  if (pathname === AUTH_ROUTES.splash || pathname === AUTH_ROUTES.welcome) {
    return <>{children}</>;
  }

  return <AuthShell>{children}</AuthShell>;
}
