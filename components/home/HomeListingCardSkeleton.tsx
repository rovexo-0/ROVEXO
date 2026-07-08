import { memo } from "react";

function HomeListingCardSkeletonInner() {
  return (
    <article
      className="home-v1-card-skeleton"
      aria-hidden
      data-listing-card-skeleton="rovexo"
    >
      <div className="home-v1-card-skeleton__media" />
      <div className="home-v1-card-skeleton__body">
        <div className="home-v1-card-skeleton__line home-v1-card-skeleton__line--price" />
        <div className="home-v1-card-skeleton__line home-v1-card-skeleton__line--title" />
        <div className="home-v1-card-skeleton__line home-v1-card-skeleton__line--title-secondary" />
        <div className="home-v1-card-skeleton__line home-v1-card-skeleton__line--meta" />
      </div>
    </article>
  );
}

export const HomeListingCardSkeleton = memo(HomeListingCardSkeletonInner);

export function HomeListingCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <HomeListingCardSkeleton key={index} />
      ))}
    </>
  );
}
