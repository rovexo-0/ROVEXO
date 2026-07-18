"use client";

import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { useSearchParams } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { WholesalePricingManager } from "@/features/wholesale/components/WholesalePricingManager";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { InventoryItem, InventoryStatus } from "@/lib/business/inventory";
import type { BusinessInventoryData } from "@/lib/business/types";

const STATUS_LABELS: Record<InventoryStatus, string> = {
  active: "Active",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
};

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
      intro={data.company.companyName}
    >
      <div className="ac-canonical flex w-full flex-col gap-ds-3 pb-ds-5">
        <CanonicalSection title="Bulk pricing">
          <WholesalePricingManager />
        </CanonicalSection>

        <CanonicalSection title="Stock">
          <CanonicalCard variant="list">
            {filteredItems.length === 0 ? (
              <CanonicalMenuRow title="No inventory items match this filter." showChevron={false} />
            ) : (
              filteredItems.map((item: InventoryItem) => (
                <CanonicalMenuRow
                  key={item.id}
                  title={item.title}
                  description={`SKU: ${item.sku} · ${item.stock} in stock · ${STATUS_LABELS[item.status]}`}
                  showChevron={false}
                  icon={
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg" aria-hidden>
                      <ProductRowImage
                        src={item.imageUrl}
                        alt=""
                        containerClassName="relative h-10 w-10"
                        sizes="40px"
                      />
                    </span>
                  }
                />
              ))
            )}
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
