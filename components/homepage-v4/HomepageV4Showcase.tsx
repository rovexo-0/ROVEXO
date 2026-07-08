"use client";

import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { memo } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { BusinessBadge, resolveBusinessBadgeKinds } from "@/components/ui/BusinessBadge";
import { FollowSellerButton } from "@/features/launch/components/FollowSellerButton";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { HP4_LISTING_CARD_PROPS } from "@/components/homepage-v4/constants";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HomepageV4ShowcaseProps = {
  section: ShowcaseSellerSection | null;
};

export const HomepageV4Showcase = memo(function HomepageV4Showcase({
  section,
}: HomepageV4ShowcaseProps) {
  if (!section || section.listings.length === 0) return null;

  const businessKinds = resolveBusinessBadgeKinds({
    sellerTier: section.sellerTier,
    verifiedBusiness: section.sellerVerified && section.sellerTier === "business",
  });

  return (
    <section aria-labelledby="rx4-showcase-heading" className="rx4-showcase">
      <div className="rx4-showcase__head">
        <p id="rx4-showcase-heading" className="rx4-label">
          Featured seller
        </p>
        <div className="rx4-showcase__seller">
          <Link href={section.profileHref} className={cn("rx4-showcase__profile", focusRing)}>
            <span className="rx4-showcase__avatar">
              <Avatar
                src={section.sellerAvatar}
                alt={section.sellerName}
                name={section.sellerName}
                size="sm"
                className="h-full w-full"
              />
            </span>
            <span className="rx4-showcase__meta">
              <span className="rx4-showcase__name">{section.sellerName}</span>
              <span className="rx4-showcase__stats">
                {businessKinds.length > 0 ? (
                  <span className="rx4-showcase__badges">
                    {businessKinds.map((kind) => (
                      <BusinessBadge key={kind} kind={kind} compact />
                    ))}
                  </span>
                ) : section.sellerVerified ? (
                  <RovexoIcon icon={RovexoIcons.badges.verified} variant="header" />
                ) : null}
                <span className="rx4-showcase__rating">
                  <RovexoIcon icon={RovexoIcons.actions.star} variant="header" />
                  {section.rating > 0 ? section.rating.toFixed(1) : "New"}
                  {section.reviewCount > 0 ? ` · ${section.reviewCount} reviews` : ""}
                </span>
              </span>
            </span>
          </Link>
          <FollowSellerButton sellerId={section.sellerId} compact />
        </div>
      </div>
      <div className="rx4-carousel" role="list" aria-label={`${section.sellerName} listings`}>
        {section.listings.map((product, index) => (
          <div key={product.id} role="listitem" className="rx4-carousel__slide">
            <ListingCard
              {...HP4_LISTING_CARD_PROPS}
              product={product}
              variant="carousel"
              priority={index < 2}
              className="rx4-card--carousel"
            />
          </div>
        ))}
      </div>
    </section>
  );
});
