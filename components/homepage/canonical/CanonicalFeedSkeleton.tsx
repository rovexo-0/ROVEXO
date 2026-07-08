import { ListingCardSkeletonGrid } from "@/components/ui/ListingCard";

export function CanonicalFeedSkeletonGrid({ count = 4 }: { count?: number }) {
  return <ListingCardSkeletonGrid count={count} />;
}
