"use client";

import type { ComponentType, SVGProps } from "react";
import {
  BagLineIcon,
  CartLineIcon,
  HeartLineIcon,
  MoreLineIcon,
  PeopleLineIcon,
  SearchLineIcon,
  StarLineIcon,
  TagLineIcon,
  TruckLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import type { HomeCategoryIconType } from "@/lib/home/constants";
import { cn } from "@/lib/cn";

type IconProps = SVGProps<SVGSVGElement>;

const CATEGORY_LINE_ICONS: Record<HomeCategoryIconType, ComponentType<IconProps>> = {
  vehicles: TruckLineIcon,
  property: TagLineIcon,
  phones: TagLineIcon,
  computers: TagLineIcon,
  electronics: TagLineIcon,
  gaming: TagLineIcon,
  fashion: BagLineIcon,
  furniture: TagLineIcon,
  "home-garden": TagLineIcon,
  sports: StarLineIcon,
  pets: HeartLineIcon,
  jobs: PeopleLineIcon,
  services: PeopleLineIcon,
  autoparts: TruckLineIcon,
  wholesale: CartLineIcon,
  auctions: TagLineIcon,
  beauty: HeartLineIcon,
  health: HeartLineIcon,
  baby: HeartLineIcon,
  jewellery: StarLineIcon,
  diy: TagLineIcon,
  tools: TagLineIcon,
  kids: HeartLineIcon,
  "kids-fashion": BagLineIcon,
  "womens-fashion": BagLineIcon,
  "mens-fashion": BagLineIcon,
  shoes: BagLineIcon,
  cycling: TruckLineIcon,
  business: WalletLineIcon,
  luxury: StarLineIcon,
  collectibles: StarLineIcon,
  handmade: TagLineIcon,
  more: MoreLineIcon,
};

type HomeCategoryIcon3DProps = {
  type: HomeCategoryIconType;
  className?: string;
  size?: number;
};

/** Absolute Final — line icons only (no Fluency 3D / premium category assets). */
export function HomeCategoryIcon3D({ type, className, size = 40 }: HomeCategoryIcon3DProps) {
  const Icon = CATEGORY_LINE_ICONS[type] ?? TagLineIcon;
  return (
    <span
      className={cn("inline-flex items-center justify-center text-current", className)}
      data-home-category-icon="line"
      style={{ width: size, height: size }}
    >
      <Icon width={size} height={size} />
    </span>
  );
}
