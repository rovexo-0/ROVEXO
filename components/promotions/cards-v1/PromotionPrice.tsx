type PromotionPriceProps = {
  priceLabel: string;
  durationLabel: string;
};

export function PromotionPrice({ priceLabel, durationLabel }: PromotionPriceProps) {
  return (
    <div className="promo-v1-price" aria-label={`${priceLabel} ${durationLabel}`}>
      <span className="promo-v1-price__value">{priceLabel}</span>
      <span className="promo-v1-price__duration">{durationLabel}</span>
    </div>
  );
}
