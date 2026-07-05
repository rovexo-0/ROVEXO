import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * ROVEXO Skeleton Design System — base primitive.
 *
 * Every skeleton in the platform extends this single component. The shimmer
 * animation, colour and reduced-motion handling live in `.rx-skeleton`
 * (styles/rovexo/utilities.css) so there is exactly one implementation and no
 * duplicated animation logic. All primitives are decorative: they are
 * `aria-hidden` and non-focusable so screen readers ignore them entirely.
 */

type Rounded = "none" | "sm" | "md" | "lg" | "full";

const roundedStyles: Record<Rounded, string> = {
  none: "rounded-none",
  sm: "rounded-ds-sm",
  md: "rounded-ds-md",
  lg: "rounded-[var(--ds-radius-premium)]",
  full: "rounded-ds-full",
};

export type SkeletonProps = {
  className?: string;
  rounded?: Rounded;
  style?: CSSProperties;
};

export function Skeleton({ className, rounded = "md", style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("rx-skeleton", roundedStyles[rounded], className)}
      style={style}
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
  lineClassName?: string;
  lastLineWidth?: string;
};

export function SkeletonText({
  lines = 3,
  className,
  lineClassName,
  lastLineWidth = "w-2/3",
}: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-ds-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-3",
            index === lines - 1 ? lastLineWidth : "w-full",
            lineClassName,
          )}
        />
      ))}
    </div>
  );
}

type SkeletonImageProps = {
  className?: string;
  rounded?: Rounded;
  /** e.g. "1 / 1", "4 / 3", "16 / 9" — keeps the box reserved so there is no CLS. */
  aspectRatio?: string;
  style?: CSSProperties;
};

export function SkeletonImage({
  className,
  rounded = "md",
  aspectRatio = "1 / 1",
  style,
}: SkeletonImageProps) {
  return (
    <Skeleton
      rounded={rounded}
      className={cn("w-full", className)}
      style={{ aspectRatio, ...style }}
    />
  );
}

type SkeletonCircleProps = {
  size?: number | string;
  className?: string;
};

export function SkeletonCircle({ size = 48, className }: SkeletonCircleProps) {
  const dimension = typeof size === "number" ? `${size}px` : size;
  return (
    <Skeleton
      rounded="full"
      className={cn("shrink-0", className)}
      style={{ width: dimension, height: dimension }}
    />
  );
}

/** Alias kept for readability at call sites (avatars are always circular here). */
export const SkeletonAvatar = SkeletonCircle;

type SkeletonButtonProps = {
  className?: string;
  fullWidth?: boolean;
  height?: number | string;
  rounded?: Rounded;
};

export function SkeletonButton({
  className,
  fullWidth = false,
  height = 44,
  rounded = "md",
}: SkeletonButtonProps) {
  const h = typeof height === "number" ? `${height}px` : height;
  return (
    <Skeleton
      rounded={rounded}
      className={cn(fullWidth ? "w-full" : "w-32", className)}
      style={{ height: h }}
    />
  );
}

type SkeletonInputProps = {
  className?: string;
  height?: number | string;
  rounded?: Rounded;
};

export function SkeletonInput({
  className,
  height = 48,
  rounded = "md",
}: SkeletonInputProps) {
  const h = typeof height === "number" ? `${height}px` : height;
  return (
    <Skeleton
      rounded={rounded}
      className={cn("w-full", className)}
      style={{ height: h }}
    />
  );
}

type SkeletonCardProps = {
  className?: string;
  children?: ReactNode;
  rounded?: Rounded;
};

/**
 * Card container that mirrors the platform surface card (border, radius,
 * padding, soft shadow). Compose primitives inside it to match any card body.
 */
export function SkeletonCard({
  className,
  children,
  rounded = "lg",
}: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col gap-ds-3 border border-border bg-surface p-ds-4 shadow-[var(--ds-shadow-soft)]",
        roundedStyles[rounded],
        className,
      )}
    >
      {children}
    </div>
  );
}
