import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCarouselSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="marketplace-listing-card" aria-hidden>
          <Skeleton className="marketplace-listing-card__image !h-[120px] !w-[158px] rounded-[22px]" rounded="sm" />
          <div className="marketplace-listing-card__body">
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}
