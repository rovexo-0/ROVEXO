import { Card } from "@/components/ui/Card";

export function ProductCarouselSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          padding="none"
          aria-hidden
          className="w-[10.5rem] shrink-0 animate-pulse snap-start sm:w-[12.5rem] md:w-[13.75rem]"
        >
          <div className="aspect-square bg-surface-muted" />
          <div className="flex flex-col gap-ds-2 p-ds-4">
            <div className="h-4 rounded-ds-sm bg-surface-muted" />
            <div className="h-4 w-2/3 rounded-ds-sm bg-surface-muted" />
            <div className="h-5 w-1/3 rounded-ds-sm bg-surface-muted" />
          </div>
        </Card>
      ))}
    </>
  );
}
