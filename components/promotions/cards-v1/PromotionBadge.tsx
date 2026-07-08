type PromotionBadgeProps = {
  label: string;
};

export function PromotionBadge({ label }: PromotionBadgeProps) {
  return <span className="promo-v1-badge">{label}</span>;
}
