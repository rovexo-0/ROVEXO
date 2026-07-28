/**
 * ROVEXO VERIFIED badge — single platform badge (Facebook-style).
 * Size: 7px · SVG only · retina · dark-mode ready · lightweight.
 */

import { cn } from "@/lib/cn";
import {
  ROVEXO_VERIFIED_BADGE_NAME,
  ROVEXO_VERIFIED_BADGE_SIZE_PX,
  ROVEXO_VERIFIED_BLUE,
  ROVEXO_VERIFIED_BLUE_DARK,
} from "@/lib/verified/constants";

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
  const px = Math.max(1, size);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox="0 0 12 12"
      className={cn("rvx-verified-badge", className)}
      role="img"
      aria-label={title}
      data-verified-badge="rovexo-v1"
      style={{
        width: px,
        height: px,
        flexShrink: 0,
        display: "inline-block",
        verticalAlign: "middle",
        color: ROVEXO_VERIFIED_BLUE,
      }}
    >
      <title>{title}</title>
      {/* Light mode fill */}
      <circle cx="6" cy="6" r="6" fill="currentColor" className="rvx-verified-badge__disc" />
      <path
        d="M3.4 6.1 5.1 7.8 8.7 4.2"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <style>{`
        .rvx-verified-badge { color: ${ROVEXO_VERIFIED_BLUE}; }
        @media (prefers-color-scheme: dark) {
          .rvx-verified-badge { color: ${ROVEXO_VERIFIED_BLUE_DARK}; }
        }
      `}</style>
    </svg>
  );
}
