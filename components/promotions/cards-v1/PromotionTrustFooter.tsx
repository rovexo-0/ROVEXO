import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import type { PromotionTrustItem } from "@/lib/promotions/catalog";

type PromotionTrustFooterProps = {
  items: PromotionTrustItem[];
};

function TrustIcon({ icon }: { icon: PromotionTrustItem["icon"] }) {
  switch (icon) {
    case "shield":
      return <PlatformEmoji emoji={PLATFORM_EMOJI.shield} size={18} />;
    case "bolt":
      return <PlatformEmoji emoji="⚡" size={18} />;
    case "chart":
      return <PlatformEmoji emoji={PLATFORM_EMOJI.analytics} size={18} />;
    case "headset":
      return <PlatformEmoji emoji={PLATFORM_EMOJI.headset} size={18} />;
    default:
      return null;
  }
}

export function PromotionTrustFooter({ items }: PromotionTrustFooterProps) {
  if (items.length === 0) return null;

  return (
    <footer className="promo-v1-trust" aria-label="Promotion trust signals">
      <div className="promo-v1-trust__grid">
        {items.map((item) => (
          <div key={item.id} className="promo-v1-trust__item">
            <span className="promo-v1-trust__icon" aria-hidden>
              <TrustIcon icon={item.icon} />
            </span>
            <div>
              <p className="promo-v1-trust__title">{item.title}</p>
              <p className="promo-v1-trust__description">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
