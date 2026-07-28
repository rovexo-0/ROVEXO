"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import { CANONICAL_LOGO_ENGINE_V1 } from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";
import { OFFICIAL_BRAND_PRIMARY_EMBLEM } from "@/lib/brand/official-brand-application-v1";

type RovexoBrandLogoProps = {
  className?: string;
  /**
   * Auth surfaces always render Level II Primary Emblem (Law XXXVIII).
   * Variant kept for call-site compatibility — both map to Primary Emblem.
   */
  variant?: "full" | "rx";
};

/**
 * Authentication brand mark — Absolute Blood Laws XXXVIII · XXXIX · XLI.
 * PRIMARY EMBLEM only (RX + Protective Hands).
 * Centered · certified scale · no stretch · no background · no CSS slogan.
 * Visual identity FINAL FREEZE under XLI until ROVEXO v2.0.
 */
export function RovexoBrandLogo({ className, variant = "full" }: RovexoBrandLogoProps) {
  void CANONICAL_LOGO_ENGINE_V1.law;
  void variant;

  return (
    <div
      className={cn(
        "rovexo-brand-logo rovexo-brand-logo--canonical rovexo-brand-logo--lockup",
        className,
      )}
      data-canonical-logo={CANONICAL_LOGO_ENGINE_V1.version}
      data-logo-engine="official-brand-application-xxxviii"
      data-brand-level="II_PRIMARY_EMBLEM"
      data-blood-law="XXXVIII"
      data-auth-brand-freeze="XXXIX"
      data-auth-experience-freeze="XLI"
      aria-label="ROVEXO"
    >
      <SafeImage
        src={OFFICIAL_BRAND_PRIMARY_EMBLEM}
        alt="ROVEXO"
        width={844}
        height={644}
        className="rovexo-brand-logo__canonical-img"
        priority
        quality={100}
        unoptimized
      />
    </div>
  );
}
