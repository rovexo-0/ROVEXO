/**
 * PWA / launch splash visual — Canonical RX lockup (Cod Sânge v2).
 * Auth guest entry remains Login. /splash is branded flash → Login only.
 */
import { RovexoBrandLogo } from "@/components/branding/RovexoBrandLogo";
import { CANONICAL_LOGO_ENGINE_V1 } from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";
import "@/styles/rovexo/canonical-rx-3d-splash.css";

export function CanonicalRx3dSplashVisual({ className }: { className?: string }) {
  void CANONICAL_LOGO_ENGINE_V1.law;

  return (
    <div
      className={["rx3d-splash", className].filter(Boolean).join(" ")}
      data-canonical-rx-3d-splash={CANONICAL_LOGO_ENGINE_V1.version}
      role="img"
      aria-label="ROVEXO"
    >
      <div className="rx3d-splash__glow" aria-hidden />
      <div className="rx3d-splash__logo">
        <RovexoBrandLogo className="rovexo-brand-logo--splash" />
      </div>
    </div>
  );
}
