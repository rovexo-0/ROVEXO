import type { CSSProperties } from "react";
import {
  PROMOTION_THEME_COLORS,
  type ResolvedPromotionCatalogEntry,
} from "@/lib/promotions/catalog";
import { PromotionBenefits } from "@/components/promotions/cards-v1/PromotionBenefits";
import { PromotionButton } from "@/components/promotions/cards-v1/PromotionButton";
import { PromotionIcon } from "@/components/promotions/cards-v1/PromotionIcon";
import { PromotionPreview } from "@/components/promotions/cards-v1/PromotionPreview";
import { PromotionPrice } from "@/components/promotions/cards-v1/PromotionPrice";

type PromotionCardProps = {
  entry: ResolvedPromotionCatalogEntry;
  busy?: boolean;
  onSelect: (entry: ResolvedPromotionCatalogEntry) => void;
};

/** Canonical Promote card — horizontal media + body (Owner mockup SSOT). */
export function PromotionCard({ entry, busy = false, onSelect }: PromotionCardProps) {
  const theme = PROMOTION_THEME_COLORS.purple;

  return (
    <article
      className={
        entry.animationEnabled
          ? "promo-v1-card promo-v1-card--split promo-v1-card--animated"
          : "promo-v1-card promo-v1-card--split"
      }
      style={
        {
          "--promo-accent": theme.accent,
          "--promo-accent-muted": theme.accentMuted,
        } as CSSProperties
      }
      aria-labelledby={`promo-card-title-${entry.id}`}
      data-promo-card={entry.id}
    >
      <div className="promo-v1-card__media">
        <PromotionPreview variant={entry.previewVariant} />
      </div>

      <div className="promo-v1-card__body">
        <div className="promo-v1-card__title-row">
          <span className="promo-v1-card__icon" aria-hidden>
            <PromotionIcon icon={entry.icon} />
          </span>
          <h2 id={`promo-card-title-${entry.id}`} className="promo-v1-card__title">
            {entry.title}
          </h2>
        </div>

        {entry.description ? (
          <p className="promo-v1-card__description">{entry.description}</p>
        ) : null}

        <PromotionBenefits benefits={entry.benefits} />

        <PromotionPrice priceLabel={entry.resolvedPriceLabel} durationLabel={entry.durationLabel} />

        <PromotionButton
          label={entry.ctaLabel}
          recommended
          disabled={busy}
          testId={`promo-cta-${entry.id}`}
          onClick={() => onSelect(entry)}
        />
      </div>
    </article>
  );
}
