import type { PromotionPreviewVariant } from "@/lib/promotions/catalog";

type PromotionPreviewProps = {
  variant: PromotionPreviewVariant;
};

export function PromotionPreview({ variant }: PromotionPreviewProps) {
  return (
    <section className="promo-v1-preview" aria-label="Where it appears preview">
      <p className="promo-v1-preview__label">Where it appears</p>
      <div className="promo-v1-preview__frame">{renderPreview(variant)}</div>
    </section>
  );
}

function renderPreview(variant: PromotionPreviewVariant) {
  switch (variant) {
    case "search-bump":
      return (
        <div className="promo-v1-mock">
          <div className="promo-v1-mock__heading">
            <span>Search results</span>
            <span className="promo-v1-mock__link">See all</span>
          </div>
          <div className="promo-v1-mock__row promo-v1-mock__row--highlight">
            <span className="promo-v1-mock__thumb" />
            <span>Your listing · bumped</span>
            <span className="promo-v1-mock__badge" aria-hidden>
              ↑
            </span>
          </div>
          <div className="promo-v1-mock__row" style={{ marginTop: 6 }}>
            <span className="promo-v1-mock__thumb" />
            <span>Other listing</span>
          </div>
        </div>
      );
    case "category-featured":
      return (
        <div className="promo-v1-mock">
          <div className="promo-v1-mock__tabs">
            <span className="promo-v1-mock__tab promo-v1-mock__tab--active">All</span>
            <span className="promo-v1-mock__tab">Electronics</span>
            <span className="promo-v1-mock__tab">Fashion</span>
          </div>
          <div className="promo-v1-mock__row promo-v1-mock__row--highlight">
            <span className="promo-v1-mock__thumb" />
            <span>Featured listing</span>
            <span className="promo-v1-mock__badge" aria-hidden>
              ★
            </span>
          </div>
        </div>
      );
    case "feed-boost":
      return (
        <div className="promo-v1-mock">
          <div className="promo-v1-mock__heading">
            <span>Recommended for you</span>
            <span className="promo-v1-mock__link">See all</span>
          </div>
          <div className="promo-v1-mock__hero" />
          <div className="promo-v1-mock__heading" style={{ marginTop: 8 }}>
            <span>New this week</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="promo-v1-mock__thumb" />
            <span className="promo-v1-mock__thumb" />
            <span className="promo-v1-mock__thumb" />
          </div>
        </div>
      );
    case "homepage-premium":
      return (
        <div className="promo-v1-mock">
          <div className="promo-v1-mock__heading">
            <span>Homepage</span>
            <span className="promo-v1-mock__link">See all</span>
          </div>
          <div className="promo-v1-mock__hero promo-v1-mock__row--highlight" />
          <div className="promo-v1-mock__dots" aria-hidden>
            <span className="promo-v1-mock__dot promo-v1-mock__dot--active" />
            <span className="promo-v1-mock__dot" />
            <span className="promo-v1-mock__dot" />
          </div>
          <div className="promo-v1-mock__heading" style={{ marginTop: 8 }}>
            <span>Premium Picks</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="promo-v1-mock__thumb" />
            <span className="promo-v1-mock__thumb" />
            <span className="promo-v1-mock__thumb" />
          </div>
        </div>
      );
    case "store-featured":
      return (
        <div className="promo-v1-mock">
          <div className="promo-v1-mock__heading">
            <span>Featured Stores</span>
            <span className="promo-v1-mock__link">See all</span>
          </div>
          <div className="promo-v1-mock__row promo-v1-mock__row--highlight">
            <span className="promo-v1-mock__store" />
            <span>
              Luxe Collective
              <br />
              ★★★★★ · 1.2k followers
            </span>
          </div>
          <div className="promo-v1-mock__heading" style={{ marginTop: 8 }}>
            <span>Shop our top stores</span>
          </div>
          <div className="promo-v1-mock__stores" aria-hidden>
            <span className="promo-v1-mock__store" />
            <span className="promo-v1-mock__store" />
            <span className="promo-v1-mock__store" />
            <span className="promo-v1-mock__store" />
          </div>
        </div>
      );
    default:
      return null;
  }
}
