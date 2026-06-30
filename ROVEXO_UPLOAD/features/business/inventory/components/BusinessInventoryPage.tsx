"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { WholesalePricingManager } from "@/features/wholesale/components/WholesalePricingManager";
import type { InventoryItem, InventoryStatus } from "@/lib/business/inventory";
import type { BusinessInventoryData } from "@/lib/business/types";

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

const STATUS_LABELS: Record<InventoryStatus, string> = {
  active: "Active",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
};

const STATUS_VARIANTS: Record<InventoryStatus, "success" | "warning" | "danger"> = {
  active: "success",
  low_stock: "warning",
  out_of_stock: "danger",
};

function InventoryRow({ item }: { item: InventoryItem }) {
  return (
    <div className="flex min-h-[72px] items-center gap-ds-3 px-ds-4 py-ds-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{item.title}</p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">SKU: {item.sku}</p>
        <div className="mt-ds-1 flex flex-wrap items-center gap-ds-2">
          <span className="text-xs text-text-secondary">{item.stock} in stock</span>
          <Badge variant={STATUS_VARIANTS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
        </div>
      </div>
    </div>
  );
}

type BusinessInventoryPageProps = {
  data: BusinessInventoryData;
};

export function BusinessInventoryPage({ data }: BusinessInventoryPageProps) {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") as InventoryStatus | null;

  const filteredItems = filter
    ? data.items.filter((item) => item.status === filter)
    : data.items;

  return (
    <BetaAppShell showBottomNav={false}>
      <header className="rx-page-header sticky top-0 z-50">
        <div
          className={cn(
            "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
            "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
          )}
        >
          <Link
            href="/business/dashboard"
            aria-label="Back to Business Dashboard"
            className={cn(
              "inline-flex min-h-ds-7 min-w-ds-7 items-center justify-center justify-self-start rounded-ds-md text-text-primary",
              focusRing,
            )}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>

          <h1 className="truncate text-center text-lg font-semibold text-text-primary">Inventory</h1>

          <span className="w-12" aria-hidden />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-3 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <p className="text-sm text-text-secondary">{data.company.companyName}</p>

        <WholesalePricingManager />

        <Card padding="none" className="overflow-hidden">
          {filteredItems.length === 0 ? (
            <p className="px-ds-4 py-ds-6 text-center text-sm text-text-secondary">
              No inventory items match this filter.
            </p>
          ) : (
            filteredItems.map((item, index) => (
              <div key={item.id} className={index > 0 ? "border-t border-border" : undefined}>
                <InventoryRow item={item} />
              </div>
            ))
          )}
        </Card>
      </main>
    </BetaAppShell>
  );
}
