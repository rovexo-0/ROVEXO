"use client";

import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { memo } from "react";
import { ListingCard } from "@/components/ui/ListingCard";
import { BusinessBadge, resolveBusinessBadgeKinds } from "@/components/ui/BusinessBadge";
import { FollowSellerButton } from "@/features/launch/components/FollowSellerButton";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { HP3_LISTING_CARD_PROPS } from "@/components/homepage-v3/constants";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HomepageV3SellerRowProps = {
  section: ShowcaseSellerSection;
};

function HomepageV3SellerRow({ section }: HomepageV3SellerRowProps) {
  const businessKinds = resolveBusinessBadgeKinds({
    sellerTier: section.sellerTier,
    verifiedBusiness: section.sellerVerified && section.sellerTier === "business",
  });

  return (
    <div className="hp3-seller-row">
      <Link href={section.profileHref} className={cn("hp3-seller-row__link", focusRing)}>
        <span className="hp3-seller-row__avatar">
          <Avatar
            src={section.sellerAvatar}
            alt={section.sellerName}
            name={section.sellerName}
            size="sm"
            className="h-full w-full"
          />
        </span>
        <span className="hp3-seller-row__meta">
          <span className="hp3-seller-row__name">{section.sellerName}</span>
          <span className="hp3-seller-row__stats">
            {businessKinds.length > 0 ? (
              <span className="hp3-seller-row__badge">
                {businessKinds.map((kind) => (
                  <BusinessBadge key={kind} kind={kind} compact />
                ))}
              </span>
            ) : section.sellerVerified ? (
              <RovexoIcon icon={RovexoIcons.badges.verified} variant="header" />
            ) : null}
            <span className="hp3-seller-row__rating">
              <RovexoIcon icon={RovexoIcons.actions.star} variant="header" />
              {section.rating > 0 ? section.rating.toFixed(1) : "New"}
              {section.reviewCount > 0 ? ` (${section.reviewCount})` : ""}
            </span>
          </span>
        </span>
      </Link>
      <FollowSellerButton sellerId={section.sellerId} compact />
    </div>
  );
}

type HomepageV3ShowcaseSectionProps = {
  section: ShowcaseSellerSection;
};

const HomepageV3ShowcaseSection = memo(function HomepageV3ShowcaseSection({
  section,
}: HomepageV3ShowcaseSectionProps) {
  return (
    <section aria-labelledby={`hp3-showcase-${section.sellerId}`} className="hp3-showcase">
      <h2 id={`hp3-showcase-${section.sellerId}`} className="sr-only">
        {section.sellerName} showcase
      </h2>
      <HomepageV3SellerRow section={section} />
      <div className="hp3-rail" role="list">
        {section.listings.map((product) => (
          <div key={product.id} role="listitem" className="hp3-rail__card">
            <ListingCard
              {...HP3_LISTING_CARD_PROPS}
              product={product}
              variant="carousel"
              className="hp3-card--rail"
              statusBadgeLabel="Showcase"
              showStatusBadge
            />
          </div>
        ))}
      </div>
    </section>
  );
});

type HomepageV3ShowcaseProps = {
  sections: ShowcaseSellerSection[];
};

export function HomepageV3Showcase({ sections }: HomepageV3ShowcaseProps) {
  if (sections.length === 0) return null;

  return (
    <div className="hp3-showcase-stack" aria-label="Featured sellers">
      {sections.map((section) => (
        <HomepageV3ShowcaseSection key={section.sellerId} section={section} />
      ))}
    </div>
  );
}
