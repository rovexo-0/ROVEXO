"use client";

import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons/icons";
import type { RovexoIconRef } from "@/lib/icons/types";
import { isValidProductImageUrl } from "@/lib/media/is-valid-product-image";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";

type ProductRowImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  fallbackIcon?: RovexoIconRef;
};

export function ProductRowImage({
  src,
  alt,
  className,
  containerClassName,
  sizes = "64px",
  fallbackIcon = RovexoIcons.dashboard.listings,
}: ProductRowImageProps) {
  const valid = isValidProductImageUrl(src);

  return (
    <div className={cn("relative overflow-hidden bg-surface-muted", containerClassName)}>
      {valid ? (
        <SafeImage
          src={src}
          alt={alt}
          fill
          className={cn("object-cover", className)}
          sizes={sizes}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <RovexoIcon icon={fallbackIcon} variant="category" />
        </div>
      )}
    </div>
  );
}
