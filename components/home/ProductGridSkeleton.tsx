import { Skeleton } from "@/components/ui/Skeleton";

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rx-listing-card" aria-hidden>
          <Skeleton className="rx-listing-card__image !h-[125px] !w-[170px] rounded-[22px]" rounded="sm" />
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
