import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { MARKETPLACE_CONNECTORS_PATH } from "@/lib/seller/marketplace/config";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";

const FEATURES = ["Bulk Import", "Bulk Publish", "Store Migration"] as const;

export function BringYourItemsDashboardCard() {
  return (
    <Card
      padding="lg"
      className="border-primary/20 bg-gradient-to-br from-primary/[0.06] to-surface"
    >
      <div className="flex items-start gap-ds-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-lg bg-white text-2xl shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
          aria-hidden
        >
          📦
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-text-primary">Bring Your Items</h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Import products from your favourite marketplaces.
          </p>
          <ul className="mt-ds-3 flex flex-wrap gap-ds-2" aria-label="Migration features">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="rounded-ds-full border border-border bg-white px-ds-3 py-1 text-xs font-medium text-text-primary"
              >
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-ds-4 flex flex-wrap items-center gap-ds-3">
            <Link
              href={MIGRATION_CENTER_PATH}
              className={cn(
                "inline-flex items-center justify-center",
                buttonVariants.primary,
                buttonSizes.md,
                "min-h-10 px-ds-5 text-sm text-white",
                focusRing,
              )}
            >
              Start Store Migration
            </Link>
            <Link
              href={MARKETPLACE_CONNECTORS_PATH}
              className={cn(
                "text-sm font-medium text-primary underline",
                focusRing,
              )}
            >
              Marketplace connectors
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
