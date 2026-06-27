"use client";

import { ListingCard, type ListingCardProps } from "@/components/ui/ListingCard";

export type HomeProductCardProps = ListingCardProps & {
  layout?: "carousel" | "grid";
  showBidButton?: boolean;
  sellerName?: string;
  sellerAvatar?: string | null;
  sellerTrustScore?: number;
  sellerTier?: string;
  sellerResponseRate?: number;
};

export function HomeProductCard(props: HomeProductCardProps) {
  return (
    <ListingCard
      {...(props as ListingCardProps)}
      useHomeWatchlist
      showShare={false}
      imageFit="contain"
      imageSizes="174px"
      imageQuality={88}
      promotionSurface={props.promotionSurface ?? "homepage"}
    />
  );
}
