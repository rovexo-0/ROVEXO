"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RovexoAppIconMark } from "@/components/brand/RovexoAppIconMark";
import { AUTH_MODULE_VERSION, AUTH_SPLASH } from "@/lib/auth/canonical";
import { resolveSplashDestination } from "@/lib/auth/bootstrap";
import { cn } from "@/lib/cn";

export function SplashScreen() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

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
      aria-label="Loading ROVEXO"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-screen="splash"
    >
      <RovexoAppIconMark className="auth-splash__mark" contained uid="splash" />
      <p className="auth-splash__wordmark">ROVEXO</p>
      <p className="auth-splash__tagline">Buy. Sell. Grow.</p>
    </div>
  );
}
