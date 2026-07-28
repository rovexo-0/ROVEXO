"use client";

import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import {
  OFFICIAL_BRAND_APP_ICON,
  OFFICIAL_BRAND_MASTER_EMBLEM,
} from "@/lib/brand/official-brand-application-v1";

type RovexoLogoProps = {
  className?: string;
  variant?: "full" | "compact" | "mark" | "responsive";
};

type RovexoLogoBrandProps = {
  className?: string;
  /** Embedded inside the integrated header search control */
  integrated?: boolean;
};

/** Header mark — Level III App Icon (Law XXXVIII) */
export function RovexoHeaderMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ROVEXO Home"
      className={cn(
        "inline-flex h-[48px] w-auto min-h-[48px] shrink-0 items-center justify-center",
        focusRing,
        transitionFast,
        "hover:opacity-90 active:scale-[0.98]",
        className,
      )}
    >
      <RovexoAppIconMark size={48} className="h-[44px] w-auto" alt="ROVEXO" />
    </Link>
  );
}

/**
 * Decorative Level III App Icon — same canonical asset as Home header.
 * No link. No duplicate brand file. Use for official ROVEXO avatars in Inbox.
 */
export function RovexoAppIconMark({
  size = 48,
  className,
  alt = "",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <SafeImage
      src={OFFICIAL_BRAND_APP_ICON}
      alt={alt}
      width={size}
      height={size}
      className={cn("object-contain", className)}
    />
  );
}

/** Inline brand mark for embedding inside the integrated header search */
export function RovexoLogoBrand({ className, integrated = false }: RovexoLogoBrandProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center", className)} aria-hidden>
      <SafeImage
        src={OFFICIAL_BRAND_APP_ICON}
        alt=""
        width={integrated ? 28 : 40}
        height={integrated ? 28 : 40}
        className={cn("w-auto object-contain", integrated ? "h-6 lg:h-7" : "h-[1.625rem]")}
      />
    </span>
  );
}

export function RovexoLogo({ className, variant = "full" }: RovexoLogoProps) {
  const isCompact = variant === "compact" || variant === "mark" || variant === "responsive";
  /** Application chrome → App Icon; marketing `full` may use Master Emblem */
  const src = isCompact ? OFFICIAL_BRAND_APP_ICON : OFFICIAL_BRAND_MASTER_EMBLEM;

  return (
    <Link
      href="/"
      aria-label="ROVEXO Home"
      className={cn(
        "inline-flex shrink-0 items-center",
        isCompact ? "h-7" : "h-[28px] sm:h-[30px] lg:h-[32px]",
        focusRing,
        transitionFast,
        "hover:opacity-90 active:scale-[0.98]",
        className,
      )}
    >
      <SafeImage
        src={src}
        alt="ROVEXO"
        width={isCompact ? 28 : 40}
        height={isCompact ? 28 : 40}
        className="h-full w-auto object-contain"
      />
    </Link>
  );
}

export const ROVEXO_LOGO_DIMENSIONS = {
  mobileHeight: 28,
  compactHeight: 32,
  desktopHeight: 32,
  integratedControlHeight: 40,
  width: 124,
} as const;
