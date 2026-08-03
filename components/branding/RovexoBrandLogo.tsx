import { cn } from "@/lib/cn";
import { CANONICAL_LOGO_ENGINE_V1 } from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";
import {
  OFFICIAL_BRAND_ASSET_REGISTRY,
  OFFICIAL_BRAND_LEVEL,
  OFFICIAL_BRAND_PRIMARY_EMBLEM,
} from "@/lib/brand/official-brand-application-v1";

type RovexoBrandLogoProps = {
  className?: string;
  /**
   * Auth surfaces always render Level II Primary Emblem (Law XXXVIII).
   * Variant kept for call-site compatibility — both map to Primary Emblem.
   */
  variant?: "full" | "rx";
};

/** Level II PNG SSOT — AVIF sibling used for LCP byte weight (same artwork). */
const PRIMARY_EMBLEM_LCP_SRC =
  OFFICIAL_BRAND_ASSET_REGISTRY.levels[OFFICIAL_BRAND_LEVEL.II_PRIMARY_EMBLEM].avif;

/**
 * Authentication brand mark — Absolute Blood Laws XXXVIII · XXXIX · XLI.
 * PRIMARY EMBLEM only (RX + Protective Hands).
 * RC7: plain <img> (no client image wrapper) for login LCP — same asset/size/appearance.
 */
export function RovexoBrandLogo({ className, variant = "full" }: RovexoBrandLogoProps) {
  void CANONICAL_LOGO_ENGINE_V1.law;
  void variant;
  void OFFICIAL_BRAND_PRIMARY_EMBLEM;

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
      {/* eslint-disable-next-line @next/next/no-img-element -- auth LCP: static AVIF, identical certified box */}
      <img
        src={PRIMARY_EMBLEM_LCP_SRC}
        alt="ROVEXO"
        width={180}
        height={137}
        className="rovexo-brand-logo__canonical-img"
        fetchPriority="high"
        decoding="sync"
      />
    </div>
  );
}
