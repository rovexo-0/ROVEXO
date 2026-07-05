import {
  Skeleton,
  SkeletonButton,
  SkeletonCircle,
  SkeletonImage,
  SkeletonInput,
  SkeletonText,
} from "@/components/ui/Skeleton";
import { ProductGridSkeleton } from "@/components/home/ProductGridSkeleton";

/**
 * ROVEXO Skeleton Design System — Page Skeletons layer.
 *
 * Each export mirrors the real page's layout and dimensions so the swap from
 * skeleton to content is a straight opacity change with zero layout shift.
 * Everything is composed from the shared primitives in components/ui/Skeleton.
 * All roots are aria-hidden via the primitives; wrappers add nothing focusable.
 */

const PAGE = "mx-auto flex w-full max-w-[480px] flex-col gap-ds-4 px-ds-4 py-ds-4";

function MobileHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between" aria-hidden="true">
      <Skeleton className="h-8 w-28" rounded="md" />
      <div className="flex items-center gap-ds-2">
        <SkeletonCircle size={40} />
        <SkeletonCircle size={40} />
      </div>
    </div>
  );
}

function ListingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-ds-3" aria-hidden="true">
      <ProductGridSkeleton count={count} />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <MobileHeaderSkeleton />
      <SkeletonInput height={44} rounded="full" />
      <div className="flex gap-ds-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-ds-2">
            <SkeletonCircle size={56} />
            <Skeleton className="h-2.5 w-12" />
          </div>
        ))}
      </div>
      <SkeletonImage aspectRatio="16 / 9" rounded="lg" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-ds-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-40 shrink-0">
            <SkeletonImage aspectRatio="1 / 1" rounded="lg" />
            <div className="mt-ds-2 flex flex-col gap-ds-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-5 w-40" />
      <ListingGrid count={6} />
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[480px]" aria-hidden="true">
      <SkeletonImage aspectRatio="1 / 1" rounded="none" />
      <div className="flex flex-col gap-ds-4 px-ds-4 py-ds-4">
        <Skeleton className="h-7 w-2/5" />
        <SkeletonText lines={2} lastLineWidth="w-3/4" />
        <div className="flex items-center gap-ds-3">
          <SkeletonCircle size={48} />
          <div className="flex flex-1 flex-col gap-ds-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <SkeletonButton height={36} className="w-20" />
        </div>
        <div className="flex gap-ds-3">
          <SkeletonButton fullWidth height={48} />
          <SkeletonButton fullWidth height={48} />
        </div>
        <Skeleton className="h-5 w-28" />
        <SkeletonText lines={4} />
        <Skeleton className="h-5 w-40" />
        <div className="flex flex-col gap-ds-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-5 w-44" />
        <div className="flex gap-ds-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-36 shrink-0">
              <SkeletonImage aspectRatio="1 / 1" rounded="lg" />
              <Skeleton className="mt-ds-2 h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SellSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <div className="flex items-center gap-ds-3">
        <SkeletonCircle size={40} />
        <Skeleton className="h-6 w-40" />
      </div>
      <SkeletonImage aspectRatio="16 / 9" rounded="lg" />
      <Skeleton className="h-3.5 w-16" />
      <SkeletonInput />
      <Skeleton className="h-3.5 w-24" />
      <SkeletonInput height={120} />
      <Skeleton className="h-3.5 w-20" />
      <SkeletonInput />
      <Skeleton className="h-3.5 w-14" />
      <SkeletonInput />
      <Skeleton className="h-3.5 w-24" />
      <SkeletonInput />
      <Skeleton className="h-3.5 w-24" />
      <div className="grid grid-cols-4 gap-ds-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonButton key={i} fullWidth height={44} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <SkeletonButton fullWidth height={52} rounded="lg" />
    </div>
  );
}

export function AccountModuleSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <MobileHeaderSkeleton />
      <div className="flex flex-col gap-ds-4 rounded-[var(--ds-radius-premium)] border border-border bg-surface p-ds-5 shadow-[var(--ds-shadow-soft)]">
        <div className="flex items-center gap-ds-4">
          <SkeletonCircle size={72} />
          <div className="flex flex-1 flex-col gap-ds-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-ds-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-ds-2">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-4 gap-ds-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-ds-2">
            <SkeletonImage aspectRatio="1 / 1" rounded="lg" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchPageSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <SkeletonInput height={44} rounded="full" />
      <div className="flex gap-ds-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" rounded="full" />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-24" rounded="full" />
      </div>
      <ListingGrid count={8} />
    </div>
  );
}

export function ListRowsSkeleton({
  rows = 8,
  withAvatar = true,
  lines = 2,
}: {
  rows?: number;
  withAvatar?: boolean;
  lines?: number;
}) {
  return (
    <div className="flex flex-col gap-ds-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-ds-3 rounded-ds-md border border-border bg-surface p-ds-3"
        >
          {withAvatar ? <SkeletonCircle size={48} /> : null}
          <div className="flex flex-1 flex-col gap-ds-2">
            <Skeleton className="h-3.5 w-2/5" />
            {Array.from({ length: lines }).map((_, j) => (
              <Skeleton key={j} className={j === lines - 1 ? "h-3 w-3/4" : "h-3 w-full"} />
            ))}
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <Skeleton className="h-6 w-40" />
      <ListRowsSkeleton rows={8} withAvatar lines={2} />
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <Skeleton className="h-6 w-32" />
      <ListRowsSkeleton rows={9} withAvatar lines={1} />
    </div>
  );
}

export function OrdersSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <Skeleton className="h-6 w-28" />
      <div className="flex flex-col gap-ds-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-ds-3 rounded-ds-md border border-border bg-surface p-ds-3"
          >
            <Skeleton className="h-16 w-16 shrink-0" rounded="md" />
            <div className="flex flex-1 flex-col gap-ds-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-20" rounded="full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SavedSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <Skeleton className="h-6 w-28" />
      <ListingGrid count={8} />
    </div>
  );
}

export function CategoriesSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-3 gap-ds-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-ds-2">
            <SkeletonImage aspectRatio="1 / 1" rounded="lg" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-ds-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" rounded="full" />
        ))}
      </div>
      <ListingGrid count={8} />
    </div>
  );
}

export function SupportSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <Skeleton className="h-7 w-48" />
      <SkeletonInput height={44} rounded="full" />
      <div className="flex flex-col gap-ds-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-ds-3 rounded-ds-md border border-border bg-surface p-ds-4"
          >
            <SkeletonCircle size={40} />
            <div className="flex flex-1 flex-col gap-ds-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCardsRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-ds-3 sm:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-ds-2 rounded-ds-md border border-border bg-surface p-ds-4"
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function WalletSkeleton() {
  return (
    <div className={PAGE} aria-hidden="true">
      <Skeleton className="h-6 w-24" />

      {/* Available balance card */}
      <div className="flex flex-col gap-ds-4 rounded-[var(--ds-radius-premium)] border border-border bg-surface p-ds-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-12 w-48" />
        <SkeletonButton fullWidth height={48} />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Pending balance card */}
      <div className="flex flex-col gap-ds-3 rounded-[var(--ds-radius-premium)] border border-border bg-surface p-ds-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-3 w-4/5" />
      </div>

      {/* Bank account card */}
      <div className="flex items-center justify-between gap-ds-3 rounded-[var(--ds-radius-premium)] border border-border bg-surface p-ds-5">
        <div className="flex items-center gap-ds-3">
          <SkeletonCircle size={48} />
          <div className="flex flex-col gap-ds-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <SkeletonButton height={44} />
      </div>

      {/* Recent transactions card */}
      <div className="flex flex-col gap-ds-2 rounded-[var(--ds-radius-premium)] border border-border bg-surface p-ds-5">
        <Skeleton className="h-5 w-40" />
        <ListRowsSkeleton rows={5} withAvatar lines={2} />
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 8, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="overflow-hidden rounded-ds-md border border-border bg-surface"
      aria-hidden="true"
    >
      <div className="flex gap-ds-3 border-b border-border p-ds-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-ds-3 border-b border-border p-ds-3 last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="flex w-full flex-col gap-ds-5 p-ds-5" aria-hidden="true">
      <Skeleton className="h-8 w-56" />
      <StatCardsRow count={4} />
      <div className="grid grid-cols-1 gap-ds-4 lg:grid-cols-2">
        <div className="rounded-ds-md border border-border bg-surface p-ds-4">
          <Skeleton className="mb-ds-3 h-5 w-40" />
          <SkeletonImage aspectRatio="16 / 9" rounded="md" />
        </div>
        <div className="rounded-ds-md border border-border bg-surface p-ds-4">
          <Skeleton className="mb-ds-3 h-5 w-40" />
          <SkeletonImage aspectRatio="16 / 9" rounded="md" />
        </div>
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}

export function SuperAdminSkeleton() {
  return (
    <div className="flex w-full flex-col gap-ds-5 p-ds-5" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-32" rounded="md" />
      </div>
      <StatCardsRow count={4} />
      <div className="grid grid-cols-1 gap-ds-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-ds-md border border-border bg-surface p-ds-4">
            <Skeleton className="mb-ds-3 h-5 w-32" />
            <SkeletonImage aspectRatio="4 / 3" rounded="md" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={10} cols={6} />
    </div>
  );
}
