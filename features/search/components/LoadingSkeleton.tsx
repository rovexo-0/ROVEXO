import { Skeleton } from "@/components/ui/Skeleton";

type LoadingSkeletonProps = {
  count?: number;
};

export function LoadingSkeleton({ count = 5 }: LoadingSkeletonProps) {
  return (
    <div
      className="flex flex-col gap-ds-2 px-ds-4 py-ds-2"
      aria-busy="true"
      aria-label="Loading search results"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 sm:min-h-[76px] sm:p-3"
          aria-hidden
        >
          <Skeleton className="h-16 w-16 shrink-0" rounded="lg" />
          <div className="flex flex-1 flex-col gap-ds-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-14 shrink-0" />
        </div>
      ))}
    </div>
  );
}
