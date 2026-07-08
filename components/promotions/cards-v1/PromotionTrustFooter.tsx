import type { PromotionTrustItem } from "@/lib/promotions/catalog";

type PromotionTrustFooterProps = {
  items: PromotionTrustItem[];
};

function TrustIcon({ icon }: { icon: PromotionTrustItem["icon"] }) {
  switch (icon) {
    case "shield":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 6v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V6l-8-3z" />
        </svg>
      );
    case "bolt":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      );
    case "chart":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16M8 17V9m4 8V7m4 10v-4" />
        </svg>
      );
    case "headset":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 14v-2a8 8 0 0 1 16 0v2M6 14h-1a1 1 0 0 0-1 1v2a2 2 0 0 0 2 2h1v-5zm13 0h1a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-1v-5z"
          />
        </svg>
      );
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
