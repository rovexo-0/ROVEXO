function HomepageV4CardSkeleton() {
  return (
    <article className="rx4-skeleton" aria-hidden data-listing-card-skeleton="rovexo">
      <div className="rx4-skeleton__media" />
      <div className="rx4-skeleton__body">
        <div className="rx4-skeleton__line rx4-skeleton__line--price" />
        <div className="rx4-skeleton__line rx4-skeleton__line--title" />
        <div className="rx4-skeleton__line rx4-skeleton__line--meta" />
      </div>
    </article>
  );
}

export function HomepageV4SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <HomepageV4CardSkeleton key={index} />
      ))}
    </>
  );
}
