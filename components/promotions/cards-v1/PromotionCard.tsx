import type { CSSProperties } from "react";
import {
  PROMOTION_THEME_COLORS,
  type ResolvedPromotionCatalogEntry,
} from "@/lib/promotions/catalog";
import { PromotionBadge } from "@/components/promotions/cards-v1/PromotionBadge";
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

export function PromotionCard({ entry, busy = false, onSelect }: PromotionCardProps) {
  const theme = PROMOTION_THEME_COLORS[entry.theme];

  return (
    <article
      className={entry.animationEnabled ? "promo-v1-card promo-v1-card--animated" : "promo-v1-card"}
      style={
        {
          "--promo-accent": theme.accent,
          "--promo-accent-muted": theme.accentMuted,
        } as CSSProperties
      }
      aria-labelledby={`promo-card-title-${entry.id}`}
    >
      <div className="promo-v1-card__icon" aria-hidden>
        <PromotionIcon icon={entry.icon} />
      </div>

      <div className="promo-v1-card__title-row">
        <h2 id={`promo-card-title-${entry.id}`} className="promo-v1-card__title">
          {entry.title}
        </h2>
        {entry.badge ? <PromotionBadge label={entry.badge} /> : null}
      </div>

      <p className="promo-v1-card__description">{entry.description}</p>

      <PromotionBenefits benefits={entry.benefits} />
      <PromotionPreview variant={entry.previewVariant} />

      <PromotionPrice priceLabel={entry.resolvedPriceLabel} durationLabel={entry.durationLabel} />

      <PromotionButton
        label={entry.ctaLabel}
        recommended={entry.recommended}
        disabled={busy}
        onClick={() => onSelect(entry)}
      />
    </article>
  );
}
