"use client";

/**
 * Profile Footer Banner — ROVEXO v1.0 RC1 FULL WIDTH (Owner COD SÂNGE).
 * Position: after Sign Out · scrolls with Profile · transparent artwork.
 * Width: 100% of Profile content container (menu-aligned). No max-height shrink.
 * Imagery via SafeImage (canonical next/image entry — image-safety lock).
 */

import { SafeImage } from "@/components/ui/SafeImage";

export const PROFILE_FOOTER_BANNER_SRC = "/images/profile/profile-footer-banner.png" as const;
export const PROFILE_FOOTER_BANNER_ALT =
  "ROVEXO mascot helping users buy, sell and grow." as const;

/** Intrinsic ratio only (CLS). CSS forces width:100%; height:auto. */
const BANNER_WIDTH = 524;
const BANNER_HEIGHT = 245;

export function ProfileFooterBanner() {
  return (
    <div className="profile-footer-banner" data-profile-footer-banner="v1.0-full-width">
      <SafeImage
        className="profile-footer-banner__img"
        src={PROFILE_FOOTER_BANNER_SRC}
        alt={PROFILE_FOOTER_BANNER_ALT}
        width={BANNER_WIDTH}
        height={BANNER_HEIGHT}
        fill={false}
        priority={false}
        loading="lazy"
        decoding="async"
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
        fallback="hide"
        draggable={false}
      />
    </div>
  );
}
