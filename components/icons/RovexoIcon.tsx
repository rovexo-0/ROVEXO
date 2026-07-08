"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import { resolveRovexoIconSrc } from "@/lib/icons/icons";
import { resolveRovexoIconSize, type RovexoIconVariant } from "@/lib/icons/sizes";
import { isGlassIconMode } from "@/lib/icons/theme";
import type { RovexoIconRef } from "@/lib/icons/types";

export type RovexoIconProps = {
  icon: RovexoIconRef;
  /** Explicit pixel size — overrides `variant`. */
  size?: number;
  /** Preset size from the global homepage icon system. */
  variant?: RovexoIconVariant;
  className?: string;
  alt?: string;
  priority?: boolean;
};

/**
 * Official ROVEXO icon renderer.
 * All UI icons must resolve through `RovexoIcons` + this component.
 */
export function RovexoIcon({
  icon,
  size,
  variant,
  className,
  alt = "",
  priority = false,
}: RovexoIconProps) {
  const px = resolveRovexoIconSize(variant, size);
  const src = resolveRovexoIconSrc(icon);
  const glass = isGlassIconMode();

  return (
    <SafeImage
      src={src}
      alt={alt}
      width={px}
      height={px}
      priority={priority}
      unoptimized
      fallback="hide"
      aria-hidden={alt ? undefined : true}
      className={cn(
        "rovexo-icon shrink-0 object-contain",
        glass ? "rovexo-icon--glass" : "rovexo-icon--standard",
        className,
      )}
      style={{ width: px, height: px }}
    />
  );
}
