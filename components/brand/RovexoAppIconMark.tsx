"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import { OFFICIAL_BRAND_APP_ICON } from "@/lib/brand/official-brand-application-v1";

type RovexoAppIconMarkProps = {
  className?: string;
  /** @deprecated unused — kept for call-site compatibility */
  uid?: string;
  /** @deprecated unused — kept for call-site compatibility */
  contained?: boolean;
};

/**
 * Level III App Icon — transparent RX only (Law XXXVIII).
 */
export function RovexoAppIconMark({ className }: RovexoAppIconMarkProps) {
  return (
    <SafeImage
      src={OFFICIAL_BRAND_APP_ICON}
      alt=""
      width={48}
      height={48}
      className={cn("rovexo-app-icon-mark", className)}
      fallback="hide"
    />
  );
}
