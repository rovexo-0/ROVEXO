"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION, AUTH_SPLASH } from "@/lib/auth/canonical";
import { resolveSplashDestination } from "@/lib/auth/bootstrap";
import { cn } from "@/lib/cn";

function SplashWordmark() {
  return (
    <p className="auth-splash__wordmark" aria-hidden>
      ROVE<span className="auth-splash__wordmark-x">X</span>O
    </p>
  );
}

/** Premium non-blocking load cue — one soft pulse, never a spinner or progress indicator. */
function SplashIndicator() {
  return <span className="auth-splash__pulse" aria-hidden />;
}

/**
 * Canonical splash bootstrap — brand stage always visible (never opacity 0).
 * Session validation runs while splash is on screen; then seamless replace.
 */
export function SplashScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const { copy } = AUTH_MASTER_SPEC.splash;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const { destination } = await resolveSplashDestination();
      if (cancelled) return;

      try {
        router.prefetch(destination);
      } catch {
        /* prefetch optional */
      }

      setReady(true);
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
      className={cn("auth-splash", "auth-splash--live", ready && "auth-splash--exit")}
      role="status"
      aria-live="polite"
      aria-label={copy.ariaLabel}
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="splash"
      data-auth-ui="v1.0-splash-final-lock"
      data-splash-lock="CANONICAL"
    >
      <div className="auth-splash__stage auth-splash__stage--wordmark-only">
        <SplashWordmark />
        <p className="auth-splash__tagline">{copy.tagline}</p>
        <SplashIndicator />
      </div>
    </div>
  );
}
