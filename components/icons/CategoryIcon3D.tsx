"use client";

import { CategoryPremiumIcon } from "@/components/category/CategoryPremiumIcon";
import {
  resolveCategoryPremiumIcon,
  type RovexoCategoryPremiumKey,
} from "@/lib/home/category-premium-library";
import { cn } from "@/lib/cn";

/** @deprecated Use RovexoCategoryPremiumKey — legacy auction grid keys */
export type CategoryIconType =
  | RovexoCategoryPremiumKey
  | "garden"
  | "wholesale"
  | "auctions"
  | "jobs";

const LEGACY_ICON_MAP: Record<string, RovexoCategoryPremiumKey> = {
  garden: "home-garden",
  wholesale: "business",
  auctions: "collectibles",
  jobs: "business",
};

type CategoryIcon3DProps = {
  type: CategoryIconType | string;
  className?: string;
  size?: number;
  containerSize?: number;
};

/** Premium PNG category icon — replaces legacy SVG CategoryIcon3D */
export function CategoryIcon3D({
  type,
  className,
  size = 40,
  containerSize = 60,
}: CategoryIcon3DProps) {
  const resolved = LEGACY_ICON_MAP[type] ?? resolveCategoryPremiumIcon(type);

  return (
    <CategoryPremiumIcon
      icon={resolved}
      size={size}
      containerSize={containerSize}
      className={cn(className)}
      animated={false}
    />
  );
}
