"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CanonicalRx3dSplashVisual } from "@/components/branding/CanonicalRx3dSplashVisual";
import { CANONICAL_RX_3D_LOGO_FREEZE } from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

/**
 * Canonical RX 3D splash visual → then Login.
 * Startup destination remains Login (auth freeze). Splash is branded launch only.
 */
export function CanonicalRx3dSplashGate() {
  const router = useRouter();

  useEffect(() => {
    void CANONICAL_RX_3D_LOGO_FREEZE.status;
    const timer = window.setTimeout(() => {
      router.replace("/login");
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [router]);

  return <CanonicalRx3dSplashVisual />;
}
