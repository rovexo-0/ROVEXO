"use client";

import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { memo } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { BusinessBadge, resolveBusinessBadgeKinds } from "@/components/ui/BusinessBadge";
import { FollowSellerButton } from "@/features/launch/components/FollowSellerButton";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { HOMEPAGE_LISTING_CARD_PROPS } from "@/components/home/constants";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type RovexoShowcaseSectionProps = {
  section: ShowcaseSellerSection;
};

function formatRating(rating: number, reviewCount: number): string {
  if (rating <= 0) return "New";
  if (reviewCount > 0) return rating.toFixed(1);
  return rating.toFixed(1);
}

export const RovexoShowcaseSection = memo(function RovexoShowcaseSection({
  section,
}: RovexoShowcaseSectionProps) {
  const businessKinds = resolveBusinessBadgeKinds({
    sellerTier: section.sellerTier,
    verifiedBusiness: section.sellerVerified && section.sellerTier === "business",
  });
  const ratingLabel = formatRating(section.rating, section.reviewCount);

  return (
    <section
      aria-labelledby={`showcase-${section.sellerId}`}
      className="rx-showcase-v2"
    >
      <div className="rx-showcase-v2__header">
        <Link
          href={section.profileHref}
          className={cn("rx-showcase-v2__seller", focusRing)}
        >
          <span className="rx-showcase-v2__avatar">
            <Avatar
              src={section.sellerAvatar}
              alt={section.sellerName}
              name={section.sellerName}
              size="sm"
              className="h-full w-full"
            />
          </span>

          <span className="rx-showcase-v2__identity">
            <span className="rx-showcase-v2__name-row">
              <span id={`showcase-${section.sellerId}`} className="rx-showcase-v2__name">
                {section.sellerName}
              </span>
              {businessKinds.length > 0 ? (
                <span className="rx-showcase-v2__verified">
                  {businessKinds.map((kind) => (
                    <BusinessBadge key={kind} kind={kind} compact />
                  ))}
                </span>
              ) : section.sellerVerified ? (
                <span className="rx-showcase-v2__verified" aria-label="Verified seller">
                  <RovexoIcon icon={RovexoIcons.badges.verified} variant="header" />
                </span>
              ) : null}
            </span>
            <span className="rx-showcase-v2__rating" aria-label={`Rating ${ratingLabel}`}>
              <RovexoIcon icon={RovexoIcons.actions.star} variant="header" />
              {ratingLabel}
              {section.reviewCount > 0 ? (
                <span className="rx-showcase-v2__review-count">({section.reviewCount})</span>
              ) : null}
            </span>
          </span>
        </Link>

        <FollowSellerButton sellerId={section.sellerId} compact />
      </div>

      <div className="rx-showcase-v2__rail" role="list">
        {section.listings.map((product) => (
          <div key={product.id} role="listitem" className="rx-showcase-v2__card">
            <ListingCard
              {...HOMEPAGE_LISTING_CARD_PROPS}
              product={product}
              variant="carousel"
              className="home-v1-listing-card--rail"
              statusBadgeLabel="Showcase"
              showStatusBadge
            />
          </div>
        ))}
      </div>
    </section>
  );
});
