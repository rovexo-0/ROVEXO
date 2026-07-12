"use client";

import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { useSearchParams } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { WholesalePricingManager } from "@/features/wholesale/components/WholesalePricingManager";
import type { InventoryItem, InventoryStatus } from "@/lib/business/inventory";
import type { BusinessInventoryData } from "@/lib/business/types";

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
      <ProductRowImage
        src={item.imageUrl}
        alt={item.title}
        containerClassName="relative h-14 w-14 shrink-0 rounded-ds-md"
        sizes="56px"
      />

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
      <CanonicalPageHeader title="Inventory" backHref="/business/dashboard" backLabel="Business tools" />
      <HubPageMain withBottomNav={false} className="mx-auto flex w-full max-w-2xl flex-col gap-ds-3 px-ds-4 py-ds-4">
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
      </HubPageMain>
    </BetaAppShell>
  );
}
