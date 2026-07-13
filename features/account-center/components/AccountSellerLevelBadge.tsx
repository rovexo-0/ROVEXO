import { SELLER_LEVEL_LABELS, type SellerLevel } from "@/lib/seller-performance/master-spec";

type AccountSellerLevelBadgeProps = {
  level: SellerLevel;
};

export function AccountSellerLevelBadge({ level }: AccountSellerLevelBadgeProps) {
  return (
    <span className="ac-canonical__seller-level-badge" data-seller-level={level}>
      {SELLER_LEVEL_LABELS[level]}
    </span>
  );
}
