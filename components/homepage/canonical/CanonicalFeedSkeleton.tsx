import { ListingCardSkeletonGrid } from "@/components/ui/ListingCard";
import css from "@/components/ui/ListingCard.module.css";

export function CanonicalFeedSkeletonGrid({ count = 4 }: { count?: number }) {
  return <ListingCardSkeletonGrid count={count} className={css.skeletonHomepage} />;
}
