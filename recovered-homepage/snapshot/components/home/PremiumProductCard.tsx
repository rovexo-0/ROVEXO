"use client";

import { memo } from "react";
import { ListingCard, type ListingCardProps } from "@/components/ui/ListingCard";
import { cn } from "@/lib/cn";

export type PremiumProductCardProps = ListingCardProps & {
  createdAt?: string | null;
  layout?: "carousel" | "grid";
  showBidButton?: boolean;
  sellerName?: string;
  sellerAvatar?: string | null;
  sellerTrustScore?: number;
  sellerTier?: string;
  sellerResponseRate?: number;
};

export const PremiumProductCard = memo(function PremiumProductCard({
  className,
  publishedAt,
  createdAt,
  condition,
  ...props
}: PremiumProductCardProps) {
  return (
    <ListingCard
      {...(props as ListingCardProps)}
      condition={condition}
      publishedAt={publishedAt ?? createdAt}
      premiumMeta
      useHomeWatchlist
      showShare={false}
      imageFit="cover"
      imageSizes="(max-width: 639px) 46vw, (max-width: 1023px) 24vw, 18vw"
      imageQuality={88}
      promotionSurface={props.promotionSurface ?? "homepage"}
      className={cn("rx-premium-product-card rx-home-product-card", className)}
    />
  );
});

/** Launch homepage listing card — shared across every marketplace rail. */
export const PremiumListingCard = PremiumProductCard;

export type PremiumListingCardProps = PremiumProductCardProps;

/** @deprecated Use PremiumListingCard — kept for existing imports */
export const HomeProductCard = PremiumProductCard;

export type HomeProductCardProps = PremiumProductCardProps;
