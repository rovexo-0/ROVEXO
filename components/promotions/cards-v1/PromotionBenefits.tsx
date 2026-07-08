type PromotionBenefitsProps = {
  benefits: string[];
};

export function PromotionBenefits({ benefits }: PromotionBenefitsProps) {
  return (
    <ul className="promo-v1-benefits" aria-label="Promotion benefits">
      {benefits.map((benefit) => (
        <li key={benefit} className="promo-v1-benefits__item">
          <span className="promo-v1-benefits__check" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3.5 8.2 6.4 11 12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>{benefit}</span>
        </li>
      ))}
    </ul>
  );
}
