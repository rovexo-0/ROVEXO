import { cn } from "@/lib/cn";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";

type AuthLayoutProps = {
  children: React.ReactNode;
  className?: string;
  /** Full-bleed splash / welcome hero — no centered column padding. */
  variant?: "form" | "hero";
};

/**
 * Canonical auth screen wrapper — use on every auth page except splash.
 * Splash bypasses the route layout shell via AuthRouteLayout.
 */
export function AuthLayout({ children, className, variant = "form" }: AuthLayoutProps) {
  if (variant === "hero") {
    return (
      <div
        className={cn(
          "auth-layout auth-layout--hero relative flex min-h-[100dvh] flex-col",
          className,
        )}
        data-auth-module={AUTH_MODULE_VERSION}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="auth-layout auth-layout--form" data-auth-module={AUTH_MODULE_VERSION}>
      <AuthShell className={className}>{children}</AuthShell>
    </div>
  );
}
