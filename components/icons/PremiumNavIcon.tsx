"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

export type PremiumNavIconType = "home" | "search" | "sell" | "saved" | "account";

type PremiumNavIconProps = {
  type: PremiumNavIconType;
  /** Rendered pixel box (square). */
  size?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Premium realistic 3D bottom-navigation icon.
 * Transparent WebP assets from /public/icons/premium/nav — no border, no plate,
 * one consistent lighting/perspective family shared with the category icons.
 */
export function PremiumNavIcon({ type, size = 28, className, priority = false }: PremiumNavIconProps) {
  return (
    <Image
      src={`/icons/premium/nav/${type}.webp`}
      alt=""
      aria-hidden
      width={size}
      height={size}
      unoptimized
      priority={priority}
      draggable={false}
      className={cn("rovexo-icon shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
