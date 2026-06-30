import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

type LoadingSkeletonProps = {
  count?: number;
};

export function LoadingSkeleton({ count = 4 }: LoadingSkeletonProps) {
  return (
    <div
      className="flex flex-col gap-ds-2 px-ds-4 py-ds-2"
      aria-busy="true"
      aria-label="Loading search results"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} padding="sm" aria-hidden>
          <div className="flex items-center gap-ds-3">
            <Skeleton className="h-14 w-14" rounded="md" />
            <div className="flex flex-1 flex-col gap-ds-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
