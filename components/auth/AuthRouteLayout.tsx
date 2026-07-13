"use client";

import { usePathname } from "next/navigation";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AUTH_ROUTES } from "@/lib/auth/canonical";

type AuthRouteLayoutProps = {
  children: React.ReactNode;
};

const BARE_AUTH_ROUTES = [
  AUTH_ROUTES.splash,
  AUTH_ROUTES.welcome,
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.forgotPassword,
] as const;

/** Splash, welcome, login, register, and forgot-password are full-bleed. */
export function AuthRouteLayout({ children }: AuthRouteLayoutProps) {
  const pathname = usePathname();

  if (BARE_AUTH_ROUTES.includes(pathname as (typeof BARE_AUTH_ROUTES)[number])) {
    return <>{children}</>;
  }

  return <AuthShell>{children}</AuthShell>;
}
