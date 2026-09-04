/**
 * ROVEXO VERIFIED badge — single platform badge.
 * Functional verification mark (emoji) · dark-mode ready · lightweight.
 */

import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import {
  ROVEXO_VERIFIED_BADGE_NAME,
  ROVEXO_VERIFIED_BADGE_SIZE_PX,
  ROVEXO_VERIFIED_BLUE,
} from "@/lib/verified/constants";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

export type VerifiedBadgeProps = {
  className?: string;
  /** Override pixel size (default 7). */
  size?: number;
  title?: string;
};

/**
 * Canonical ROVEXO VERIFIED mark. Render only when the user is verified.
 * Do not invent alternate badges (paid / admin / manual).
 */
export function VerifiedBadge({
  className,
  size = ROVEXO_VERIFIED_BADGE_SIZE_PX,
  title = ROVEXO_VERIFIED_BADGE_NAME,
}: VerifiedBadgeProps) {
  const px = Math.max(12, size);
  return (
    <PlatformEmoji
      emoji={PLATFORM_EMOJI.verified}
      size={px}
      className={cn("rvx-verified-badge", className)}
      role="img"
      aria-hidden={false}
      aria-label={title}
      title={title}
      data-verified-badge="rovexo-v1"
      style={{
        color: ROVEXO_VERIFIED_BLUE,
        flexShrink: 0,
        display: "inline-flex",
        verticalAlign: "middle",
      }}
    />
  );
}
