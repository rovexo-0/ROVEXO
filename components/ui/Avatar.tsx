"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";

export type AvatarSize = "sm" | "md" | "lg" | "xl" | "header" | "nav";

export type AvatarProps = {
  src?: string | null;
  alt: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
};

const sizeStyles: Record<AvatarSize, { container: string; text: string; image: number }> = {
  sm: { container: "h-8 w-8", text: "text-xs", image: 32 },
  nav: { container: "h-8 w-8", text: "text-xs", image: 32 },
  md: { container: "h-10 w-10", text: "text-sm", image: 40 },
  header: { container: "h-[42px] w-[42px]", text: "text-sm", image: 42 },
  lg: { container: "h-12 w-12", text: "text-base", image: 48 },
  xl: { container: "h-20 w-20", text: "text-xl", image: 80 },
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ src, alt, name, size = "md", className }: AvatarProps) {
  const styles = sizeStyles[size];
  const initials = name ? getInitials(name) : alt.slice(0, 1).toUpperCase();
  const imageSrc = normalizeAvatarUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const broken = failedSrc === imageSrc;

  const showImage = Boolean(imageSrc) && !broken;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-ds-full bg-surface-muted ring-1 ring-border",
        styles.container,
        className,
      )}
    >
      {showImage ? (
        <SafeImage
          src={imageSrc}
          alt={alt}
          fill
          sizes={`${styles.image}px`}
          className="object-cover"
          fallback="hide"
          onError={() => setFailedSrc(imageSrc)}
        />
      ) : (
        <span
          aria-hidden={!!name}
          className={cn(
            "flex h-full w-full items-center justify-center font-semibold text-text-secondary",
            styles.text,
          )}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
