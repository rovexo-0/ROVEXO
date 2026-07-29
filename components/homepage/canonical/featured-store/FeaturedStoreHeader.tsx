"use client";

import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { memo } from "react";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import css from "@/components/homepage/canonical/featured-store/FeaturedStore.module.css";

type FeaturedStoreHeaderProps = {
  section: ShowcaseSellerSection;
};

function formatJoinedLabel(joinedAt?: string | null): string {
  if (!joinedAt) return "Joined May 2026";
  const date = new Date(joinedAt);
  if (Number.isNaN(date.getTime())) return "Joined May 2026";
  return `Joined ${date.toLocaleString("en-GB", { month: "short", year: "numeric" })}`;
}

function formatRatingLine(rating: number, reviewCount: number): string {
  const value = rating > 0 ? rating : 5;
  const count = reviewCount > 0 ? reviewCount : 0;
  return `${value.toFixed(1)} ★ (${count.toLocaleString("en-GB")})`;
}

/**
 * Showcase Store Header — Avatar · Name · Rating · Joined.
 * Social Follow permanently removed (CEO Social System Removal).
 */
export const FeaturedStoreHeader = memo(function FeaturedStoreHeader({
  section,
}: FeaturedStoreHeaderProps) {
  const ratingLine = formatRatingLine(section.rating, section.reviewCount);
  const joinedLabel = formatJoinedLabel(section.joinedAt);

  return (
    <header className={css.headerCard} data-hp-store-header="v2.0">
      <Link href={section.profileHref} className={css.identity} aria-label={`Open ${section.sellerName} profile`}>
        <span className={css.logo}>
          <Avatar
            src={section.sellerAvatar}
            alt={section.sellerName}
            name={section.sellerName}
            size="md"
            className="h-full w-full"
          />
        </span>
        <span className={css.identityText}>
          <span className={css.storeName}>{section.sellerName}</span>
          <span className={css.ratingText}>{ratingLine}</span>
          <span className={css.joinedText}>{joinedLabel}</span>
        </span>
      </Link>
    </header>
  );
});
