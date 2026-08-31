import { Skeleton } from "@/components/ui/Skeleton";

/**
 * OPT-HP-LCP: no legacy listing-card stylesheet import — platform `loading.tsx`
 * → HomeSkeleton → this file previously pulled that CSS onto every Homepage document.
 * Skeleton layout uses Tailwind only (visual parity for loading placeholders).
 */
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex w-full min-w-0 flex-col overflow-hidden" aria-hidden>
          <Skeleton className="!aspect-square !h-auto !w-full !rounded-none" rounded="sm" />
          <div className="flex flex-col gap-2 p-2">
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}
