"use client";

import Link from "next/link";
import { memo } from "react";
import { SELL_WIZARD_PATH } from "@/lib/seller/migration/config";
import { MIGRATION_PLATFORMS } from "@/lib/seller/migration/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";

const PLATFORM_PREVIEW = MIGRATION_PLATFORMS.slice(0, 7)
  .map((platform) => platform.name)
  .join(" · ");

export const StoreMigrationHeroBanner = memo(function StoreMigrationHeroBanner() {
  return (
    <section aria-labelledby="store-migration-banner-heading" className="px-ds-4">
      <Link
        href={SELL_WIZARD_PATH}
        className={cn(
          "bring-your-item-banner-2026 group border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-surface shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-colors hover:border-primary/35",
          focusRing,
        )}
      >
        <div className="bring-your-item-banner-2026__inner">
          <div className="min-w-0">
            <p id="store-migration-banner-heading" className="text-xs font-bold uppercase tracking-wide text-primary sm:text-sm">
              🚀 Stop Recreating Listings.
            </p>
            <h2 className="mt-ds-1 text-base font-bold leading-snug text-text-primary sm:text-lg md:text-xl">
              Move Your Entire Store to ROVEXO.
            </h2>
            <p className="mt-ds-1 text-xs leading-relaxed text-text-secondary sm:text-sm">
              Import everything. Publish everything. Start selling today.
            </p>
          </div>

          <div className="mt-ds-2 flex flex-col gap-ds-2 sm:mt-ds-3">
            <p className="line-clamp-2 text-[10px] leading-relaxed text-text-muted sm:text-xs">
              {PLATFORM_PREVIEW} and many more…
            </p>
            <span
              className={cn(
                "inline-flex w-fit items-center justify-center",
                buttonVariants.primary,
                buttonSizes.md,
                "min-h-10 px-ds-5 text-sm text-white",
              )}
            >
              Bring Your Item
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
});
