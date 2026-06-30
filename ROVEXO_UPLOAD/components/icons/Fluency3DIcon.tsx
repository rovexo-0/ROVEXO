"use client";

import { cn } from "@/lib/cn";
import {
  getFluency3DAssetPath,
  getFluency3DSrcSet,
  type Fluency3DIconKey,
} from "@/lib/icons/fluency-3d-registry";

type Fluency3DIconProps = {
  icon: Fluency3DIconKey | string;
  size?: number;
  className?: string;
  alt?: string;
};

export function Fluency3DIcon({ icon, size = 32, className, alt = "" }: Fluency3DIconProps) {
  const sizesAttr = `${size}px`;

  return (
    <picture
      className={cn("inline-flex shrink-0 items-center justify-center leading-none", className)}
      style={{ width: size, height: size }}
    >
      <source type="image/avif" srcSet={getFluency3DSrcSet(icon, "avif")} sizes={sizesAttr} />
      <source type="image/webp" srcSet={getFluency3DSrcSet(icon, "webp")} sizes={sizesAttr} />
      <img
        src={getFluency3DAssetPath(icon, "png", 128)}
        srcSet={getFluency3DSrcSet(icon, "png")}
        sizes={sizesAttr}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        draggable={false}
        aria-hidden={!alt}
        decoding="async"
      />
    </picture>
  );
}
