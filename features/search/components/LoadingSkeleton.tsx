import { Card } from "@/components/ui/Card";

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
        <Card key={index} padding="sm" aria-hidden className="animate-pulse">
          <div className="flex items-center gap-ds-3">
            <div className="h-14 w-14 rounded-ds-md bg-surface-muted" />
            <div className="flex flex-1 flex-col gap-ds-2">
              <div className="h-4 w-3/4 rounded-ds-sm bg-surface-muted" />
              <div className="h-3 w-1/3 rounded-ds-sm bg-surface-muted" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
