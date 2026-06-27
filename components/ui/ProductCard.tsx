"use client";

import { ListingCard, type ListingCardProps } from "@/components/ui/ListingCard";

export type ProductCardProps = Omit<ListingCardProps, "useHomeWatchlist" | "showShare" | "imageFit" | "imageSizes" | "imageQuality" | "auctionEndsAt" | "auctionCurrentBid">;

export function ProductCard(props: ProductCardProps) {
  return <ListingCard {...props} showShare imageFit="cover" imageSizes="182px" />;
}
