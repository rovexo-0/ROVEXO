import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import { categoryTypeEmoji } from "@/lib/icons/platform-emoji-v1";

export type CategoryIconType =
  | "vehicles"
  | "property"
  | "phones"
  | "computers"
  | "fashion"
  | "electronics"
  | "furniture"
  | "garden"
  | "sports"
  | "pets"
  | "gaming"
  | "jobs"
  | "services"
  | "autoparts"
  | "wholesale"
  | "auctions"
  | "more";

type CategoryIcon3DProps = {
  type: CategoryIconType;
  className?: string;
};

export function CategoryIcon3D({ type, className }: CategoryIcon3DProps) {
  return (
    <PlatformEmoji
      emoji={categoryTypeEmoji(type)}
      size={34}
      className={cn("category-icon-3d", className)}
    />
  );
}
