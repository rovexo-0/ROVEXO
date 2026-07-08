function HomepageV3CardSkeleton() {
  return (
    <article className="hp3-skeleton" aria-hidden data-listing-card-skeleton="rovexo">
      <div className="hp3-skeleton__media" />
      <div className="hp3-skeleton__body">
        <div className="hp3-skeleton__line hp3-skeleton__line--price" />
        <div className="hp3-skeleton__line hp3-skeleton__line--title" />
        <div className="hp3-skeleton__line hp3-skeleton__line--title2" />
        <div className="hp3-skeleton__line hp3-skeleton__line--meta" />
      </div>
    </article>
  );
}

export function HomepageV3SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <HomepageV3CardSkeleton key={index} />
      ))}
    </>
  );
}
