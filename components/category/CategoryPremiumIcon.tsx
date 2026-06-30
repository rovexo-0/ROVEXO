"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  getCategoryPremiumPngSrc,
  getCategoryPremiumSrcSet,
  resolveCategoryPremiumIcon,
  type RovexoCategoryPremiumKey,
} from "@/lib/home/category-premium-library";
import { cn } from "@/lib/cn";

export type CategoryPremiumIconProps = {
  /** Category slug or premium PNG key */
  icon: string;
  /** Icon render size in px (default 40) */
  size?: number;
  /** Glass container size in px (default 60) */
  containerSize?: number;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  animated?: boolean;
  label?: string;
};

export const CategoryPremiumIcon = memo(function CategoryPremiumIcon({
  icon,
  size = 40,
  containerSize = 60,
  className,
  containerClassName,
  priority = false,
  animated = true,
  label,
}: CategoryPremiumIconProps) {
  const resolved: RovexoCategoryPremiumKey = resolveCategoryPremiumIcon(icon);
  const pngSrc = getCategoryPremiumPngSrc(resolved);
  const pngSrcSet = getCategoryPremiumSrcSet(resolved, "png");

  const image = (
    <img
      src={pngSrc}
      srcSet={pngSrcSet}
      sizes={`${size}px`}
      alt={label ?? ""}
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className={cn(
        "rx-category-premium-icon__img pointer-events-none object-contain",
        "drop-shadow-[0_8px_16px_rgba(99,102,241,0.22)]",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );

  const container = (
    <span
      className={cn(
        "rx-category-premium-icon inline-flex items-center justify-center rounded-[1.125rem]",
        "border border-white/60 bg-white/75 shadow-[0_10px_28px_-14px_rgba(99,102,241,0.4)] backdrop-blur-xl",
        containerClassName,
      )}
      style={{ width: containerSize, height: containerSize }}
      data-category-icon={resolved}
      data-category-renderer="CategoryPremiumIcon-png"
    >
      {image}
    </span>
  );

  if (!animated) return container;

  return (
    <motion.span
      className="inline-flex"
      whileHover={{ y: -3, scale: 1.04 }}
      animate={{ y: [0, -2, 0] }}
      transition={{
        y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
        default: { type: "spring", stiffness: 420, damping: 24 },
      }}
    >
      {container}
    </motion.span>
  );
});
