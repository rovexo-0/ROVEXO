import {
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { InventoryOverview } from "@/lib/business/inventory";

type InventoryOverviewSectionProps = {
  overview: InventoryOverview;
};

export function InventoryOverviewSection({ overview }: InventoryOverviewSectionProps) {
  return (
    <CanonicalSection title="Inventory Overview" titleId="inventory-overview-heading">
      <CanonicalMenuRow
        title="Available listings"
        value={String(overview.availableListings)}
        href="/business/inventory"
      />
      <CanonicalMenuRow
        title="Out of stock listings"
        value={String(overview.outOfStock)}
        href="/business/inventory?filter=out_of_stock"
      />
      <CanonicalMenuRow
        title="Total inventory"
        value={String(overview.totalInventory)}
        href="/business/inventory"
      />
      <CanonicalMenuRow
        title="Units sold"
        value={String(overview.unitsSold)}
        href="/seller/orders"
      />
      <CanonicalMenuRow
        title="Low Stock"
        value={String(overview.lowStock)}
        href="/business/inventory?filter=low_stock"
      />
    </CanonicalSection>
  );
}
