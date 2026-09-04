"use client";

import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import { rovexoIconRefEmoji } from "@/lib/icons/platform-emoji-v1";
import { resolveRovexoIconSize, type RovexoIconVariant } from "@/lib/icons/sizes";
import type { RovexoIconRef } from "@/lib/icons/types";

export type RovexoIconProps = {
  icon: RovexoIconRef;
  size?: number;
  variant?: RovexoIconVariant;
  className?: string;
  alt?: string;
  priority?: boolean;
};

/**
 * Official ROVEXO functional icon renderer — platform emoji (not SVG/image glyphs).
 * Photographic category heroes and product photos stay on SafeImage elsewhere.
 */
export function RovexoIcon({
  icon,
  size,
  variant,
  className,
  alt = "",
  priority = false,
}: RovexoIconProps) {
  void priority;
  const px = resolveRovexoIconSize(variant, size);
  const emoji = rovexoIconRefEmoji(icon.folder, icon.name);

  return (
    <PlatformEmoji
      emoji={emoji}
      width={px}
      height={px}
      className={cn("rovexo-icon shrink-0", className)}
      title={alt || undefined}
    />
  );
}
