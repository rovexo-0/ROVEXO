"use client";

import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { memo, useId } from "react";
import { FollowSellerButton } from "@/features/launch/components/FollowSellerButton";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import css from "@/components/homepage/canonical/featured-store/FeaturedStore.module.css";

type FeaturedStoreHeaderProps = {
  section: ShowcaseSellerSection;
};

function StarRow({ rating }: { rating: number }) {
  const uid = useId().replace(/:/g, "");
  const clamped = Math.max(0, Math.min(5, rating));

  return (
    <span className={css.stars} aria-label={`${clamped.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, clamped - i));
        const gradId = `${uid}-s${i}`;
        return (
          <svg key={i} viewBox="0 0 24 24" width="12" height="12" aria-hidden>
            <defs>
              <linearGradient id={gradId}>
                <stop offset={`${fill * 100}%`} stopColor="#FFC107" />
                <stop offset={`${fill * 100}%`} stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#${gradId})`}
              d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
        );
      })}
    </span>
  );
}

export const FeaturedStoreHeader = memo(function FeaturedStoreHeader({
  section,
}: FeaturedStoreHeaderProps) {
  const displayRating = section.rating > 0 ? section.rating : 0;

  return (
    <header className={css.header}>
      <Link href={section.profileHref} className={css.identity}>
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
          <span className={css.ratingLine}>
            <StarRow rating={displayRating} />
          </span>
        </span>
      </Link>
      <div className={css.headerActions}>
        <Link href={section.profileHref} className={css.visit}>
          Visit Store
        </Link>
        <FollowSellerButton sellerId={section.sellerId} compact />
      </div>
    </header>
  );
});
