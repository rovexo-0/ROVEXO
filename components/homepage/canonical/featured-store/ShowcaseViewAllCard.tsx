import Link from "next/link";
import { memo } from "react";
import {
  formatShowcaseProductCount,
  SHOWCASE_VIEW_ALL_COPY,
} from "@/lib/homepage/showcase-final-freeze-v1";
import css from "@/components/homepage/canonical/featured-store/FeaturedStore.module.css";

type ShowcaseViewAllCardProps = {
  href: string;
  listingCount: number;
  storeName: string;
};

/**
 * Homepage Showcase slot 10 — single View All card.
 * Opens the Store page. Displays total listing count.
 */
export const ShowcaseViewAllCard = memo(function ShowcaseViewAllCard({
  href,
  listingCount,
  storeName,
}: ShowcaseViewAllCardProps) {
  const countLabel = formatShowcaseProductCount(listingCount);

  return (
    <Link
      href={href}
      className={css.viewAllCard}
      data-hp-showcase-view-all="v1.0"
      aria-label={`View all ${countLabel} from ${storeName}`}
    >
      <span className={css.viewAllTitle}>{SHOWCASE_VIEW_ALL_COPY.title}</span>
      <span className={css.viewAllCount}>{countLabel}</span>
      <span className={css.viewAllHint}>{SHOWCASE_VIEW_ALL_COPY.tapHint}</span>
    </Link>
  );
});
