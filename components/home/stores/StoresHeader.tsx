"use client";

import { Avatar } from "@/components/ui/Avatar";
import { PremiumButtonLink } from "@/components/ui/PremiumButton";
import Link from "next/link";
import { memo } from "react";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import css from "@/components/home/stores/StoresHeader.module.css";

const MAX_STORE_PRODUCTS = 3;

type StoresHeaderProps = {
  section: ShowcaseSellerSection;
};

function StarRow({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, rating));

  return (
    <span className={css.stars} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, clamped - i));
        return (
          <PlatformEmoji
            key={i}
            emoji={PLATFORM_EMOJI.star}
            size={12}
            style={{ opacity: fill === 0 ? 0.28 : fill < 1 ? 0.55 : 1 }}
          />
        );
      })}
    </span>
  );
}

function formatReviewCount(count: number): string {
  if (count <= 0) return "No reviews";
  if (count === 1) return "1 review";
  return `${count.toLocaleString("en-GB")} reviews`;
}

export const StoresHeader = memo(function StoresHeader({ section }: StoresHeaderProps) {
  return (
    <header className={css.header}>
      <Link href={section.profileHref} className={css.identity}>
        <span className={css.avatar}>
          <Avatar
            src={section.sellerAvatar}
            alt={section.sellerName}
            name={section.sellerName}
            size="md"
            className="h-full w-full"
          />
        </span>
        <span className={css.meta}>
          <span className={css.name}>{section.sellerName}</span>
          <span className={css.ratingRow}>
            <StarRow rating={section.rating > 0 ? section.rating : 5} />
            <span className={css.reviews}>{formatReviewCount(section.reviewCount)}</span>
          </span>
        </span>
      </Link>
      <PremiumButtonLink href={section.profileHref} variant="primary" size="sm" pair>
        Visit Store
      </PremiumButtonLink>
    </header>
  );
});

export { MAX_STORE_PRODUCTS };
