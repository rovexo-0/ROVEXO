import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import type { InventoryOverview } from "@/lib/business/inventory";

type InventoryOverviewSectionProps = {
  overview: InventoryOverview;
};

type InventoryStatCardProps = {
  label: string;
  value: number;
  href: string;
  accentClassName?: string;
};

function InventoryStatCard({ label, value, href, accentClassName }: InventoryStatCardProps) {
  return (
    <Link href={href} className="block">
      <Card
        padding="sm"
        interactive
        className={cn(
          "flex min-h-[88px] flex-col justify-center gap-ds-1",
          transitionFast,
          focusRing,
        )}
      >
        <span className={cn("text-lg font-bold tabular-nums text-text-primary", accentClassName)}>
          <AnimatedCounter value={value} />
        </span>
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      </Card>
    </Link>
  );
}

export function InventoryOverviewSection({ overview }: InventoryOverviewSectionProps) {
  return (
    <section aria-labelledby="inventory-overview-heading" className="flex flex-col gap-ds-3">
      <h2 id="inventory-overview-heading" className="text-base font-semibold text-text-primary">
        Inventory Overview
      </h2>

      <div className="grid grid-cols-3 gap-ds-3">
        <InventoryStatCard
          label="Total Products"
          value={overview.totalProducts}
          href="/business/inventory"
        />
        <InventoryStatCard
          label="Low Stock"
          value={overview.lowStock}
          href="/business/inventory?filter=low_stock"
          accentClassName="text-warning"
        />
        <InventoryStatCard
          label="Out of Stock"
          value={overview.outOfStock}
          href="/business/inventory?filter=out_of_stock"
          accentClassName="text-danger"
        />
      </div>
    </section>
  );
}
