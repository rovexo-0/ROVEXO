import { cn } from "@/lib/cn";
import { SELLER_LEVEL_LABELS, type SellerLevel } from "@/lib/seller-performance/master-spec";

type SellerLevelBadgeProps = {
  level: SellerLevel;
  className?: string;
};

const LEVEL_STYLES: Record<SellerLevel, string> = {
  new_seller: "bg-secondary text-text-secondary",
  trusted_seller: "bg-info/15 text-info",
  top_seller: "bg-primary/15 text-primary",
  premium_seller: "bg-warning/15 text-warning",
  elite_seller: "bg-success/15 text-success",
};

export function SellerLevelBadge({ level, className }: SellerLevelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-ds-full px-3 py-1 text-xs font-semibold",
        LEVEL_STYLES[level],
        className,
      )}
    >
      {SELLER_LEVEL_LABELS[level]}
    </span>
  );
}
