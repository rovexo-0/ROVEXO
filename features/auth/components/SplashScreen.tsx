"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RovexoAppIconMark } from "@/components/brand/RovexoAppIconMark";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION, AUTH_SPLASH } from "@/lib/auth/canonical";
import { resolveSplashDestination } from "@/lib/auth/bootstrap";
import { cn } from "@/lib/cn";

function SplashWordmark() {
  return (
    <p className="auth-splash__wordmark" aria-hidden>
      ROV<span className="text-primary">X</span>O
    </p>
  );
}

export function SplashScreen() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const { copy } = AUTH_MASTER_SPEC.splash;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const { destination } = await resolveSplashDestination();
      if (cancelled) return;

      setExiting(true);
      window.setTimeout(() => {
        if (!cancelled) {
          router.replace(destination);
        }
      }, AUTH_SPLASH.fadeDurationMs);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div
      className={cn("auth-splash", exiting && "auth-splash--exit")}
      role="status"
      aria-live="polite"
      aria-label={copy.ariaLabel}
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="splash"
    >
      <RovexoAppIconMark className="auth-splash__mark" contained uid="splash" />
      <SplashWordmark />
      <p className="auth-splash__tagline">{copy.tagline}</p>
    </div>
  );
}
