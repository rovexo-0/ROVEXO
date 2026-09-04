import {
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { InventoryOverview } from "@/lib/business/inventory";
import { PWA_BUSINESS_ACTION_EMOJI } from "@/lib/business/pwa-business-menu-v1";

type InventoryOverviewSectionProps = {
  overview: InventoryOverview;
};

export function InventoryOverviewSection({ overview }: InventoryOverviewSectionProps) {
  return (
    <CanonicalSection title="📦 Inventory Overview" titleId="inventory-overview-heading">
      <CanonicalMenuRow
        title="Available listings"
        value={String(overview.availableListings)}
        href="/business/inventory"
        showChevron={false}
        trailing={<span aria-hidden>›</span>}
        icon={
          <span className="ac-canonical__menu-emoji" aria-hidden>
            {PWA_BUSINESS_ACTION_EMOJI.available}
          </span>
        }
      />
      <CanonicalMenuRow
        title="Out of stock listings"
        value={String(overview.outOfStock)}
        href="/business/inventory?filter=out_of_stock"
        showChevron={false}
        trailing={<span aria-hidden>›</span>}
        icon={
          <span className="ac-canonical__menu-emoji" aria-hidden>
            {PWA_BUSINESS_ACTION_EMOJI.outOfStock}
          </span>
        }
      />
      <CanonicalMenuRow
        title="Total inventory"
        value={String(overview.totalInventory)}
        href="/business/inventory"
        showChevron={false}
        trailing={<span aria-hidden>›</span>}
        icon={
          <span className="ac-canonical__menu-emoji" aria-hidden>
            {PWA_BUSINESS_ACTION_EMOJI.totalInventory}
          </span>
        }
      />
      <CanonicalMenuRow
        title="Units sold"
        value={String(overview.unitsSold)}
        href="/seller/orders"
        showChevron={false}
        trailing={<span aria-hidden>›</span>}
        icon={
          <span className="ac-canonical__menu-emoji" aria-hidden>
            {PWA_BUSINESS_ACTION_EMOJI.unitsSold}
          </span>
        }
      />
      <CanonicalMenuRow
        title="Low Stock"
        value={String(overview.lowStock)}
        href="/business/inventory?filter=low_stock"
        showChevron={false}
        trailing={<span aria-hidden>›</span>}
        icon={
          <span className="ac-canonical__menu-emoji" aria-hidden>
            {PWA_BUSINESS_ACTION_EMOJI.lowStock}
          </span>
        }
      />
    </CanonicalSection>
  );
}
