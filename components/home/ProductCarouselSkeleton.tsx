import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCarouselSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rx-listing-card" aria-hidden>
          <Skeleton className="rx-listing-card__image !aspect-square !h-auto !w-full !rounded-none" rounded="sm" />
          <div className="rx-listing-card__body">
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}
