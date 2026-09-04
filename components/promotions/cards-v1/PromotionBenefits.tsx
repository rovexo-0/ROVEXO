import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

type PromotionBenefitsProps = {
  benefits: string[];
};

export function PromotionBenefits({ benefits }: PromotionBenefitsProps) {
  return (
    <ul className="promo-v1-benefits" aria-label="Promotion benefits">
      {benefits.map((benefit) => (
        <li key={benefit} className="promo-v1-benefits__item">
          <span className="promo-v1-benefits__check" aria-hidden>
            <PlatformEmoji emoji={PLATFORM_EMOJI.check} size={14} />
          </span>
          <span>{benefit}</span>
        </li>
      ))}
    </ul>
  );
}
