"use client";

import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { OFFICIAL_BRAND_APP_ICON } from "@/lib/brand/official-brand-application-v1";

export type RovexoWordmarkProps = {
  className?: string;
  /** When true, renders as a home link. */
  asLink?: boolean;
};

/** Application chrome wordmark — Level III App Icon (Law XXXVIII). */
export function RovexoWordmark({ className, asLink = false }: RovexoWordmarkProps) {
  const mark = (
    <SafeImage
      src={OFFICIAL_BRAND_APP_ICON}
      alt="ROVEXO"
      width={48}
      height={48}
      className={cn("rx-wordmark rx-wordmark--canonical", className)}
    />
  );

  if (!asLink) return mark;

  return (
    <Link href="/" aria-label="ROVEXO Home" className={cn("rx-wordmark-link", focusRing)}>
      {mark}
    </Link>
  );
}
