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
        title="Total Products"
        value={String(overview.totalProducts)}
        href="/business/inventory"
      />
      <CanonicalMenuRow
        title="Low Stock"
        value={String(overview.lowStock)}
        href="/business/inventory?filter=low_stock"
      />
      <CanonicalMenuRow
        title="Out of Stock"
        value={String(overview.outOfStock)}
        href="/business/inventory?filter=out_of_stock"
      />
    </CanonicalSection>
  );
}
