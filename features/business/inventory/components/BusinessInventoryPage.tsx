"use client";

import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { useSearchParams } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { Badge } from "@/components/ui/Badge";
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
    <div className="flex min-h-[72px] items-center gap-ds-3 py-ds-3">
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
    <AccountCanonicalShell
      title="Inventory"
      backHref="/business/dashboard"
      backLabel="Business"
      showHeaderTitle
      showBottomNav={false}
    >
      <div className="flex w-full flex-col gap-ds-3 px-ds-4 pb-ds-5">
        <p className="text-sm text-text-secondary">{data.company.companyName}</p>

        <WholesalePricingManager />

        <div className="divide-y divide-border">
          {filteredItems.length === 0 ? (
            <p className="py-ds-6 text-center text-sm text-text-secondary">
              No inventory items match this filter.
            </p>
          ) : (
            filteredItems.map((item) => <InventoryRow key={item.id} item={item} />)
          )}
        </div>
      </div>
    </AccountCanonicalShell>
  );
}
