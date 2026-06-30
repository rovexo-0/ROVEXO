"use client";

import Link from "next/link";
import { memo } from "react";
import { IMPORT_WIZARD_PATH } from "@/lib/seller/migration/config";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";

/** Approved launch homepage — marketplace import sources (display only). */
export const BRING_YOUR_ITEMS_PLATFORMS = [
  "Facebook Marketplace",
  "eBay",
  "Amazon",
  "Etsy",
  "Vinted",
  "Depop",
  "Shopify",
] as const;

type BringYourItemsBannerProps = {
  className?: string;
};

export const BringYourItemsBanner = memo(function BringYourItemsBanner({
  className,
}: BringYourItemsBannerProps) {
  return (
    <section
      aria-labelledby="bring-your-items-heading"
      className={cn("rx-bring-items-section px-ds-4", className)}
    >
      <div className="rx-bring-items-banner">
        <div className="rx-bring-items-banner__copy">
          <p className="rx-bring-items-banner__eyebrow">Bring Your Items</p>
          <h2 id="bring-your-items-heading" className="rx-bring-items-banner__title">
            Move Your Entire Store to ROVEXO
          </h2>
          <p className="rx-bring-items-banner__subtitle">
            Import listings from your favourite marketplaces in minutes.
          </p>
        </div>

        <div
          className="rx-bring-items-platforms"
          role="list"
          aria-label="Supported marketplaces"
        >
          {BRING_YOUR_ITEMS_PLATFORMS.map((platform) => (
            <span key={platform} role="listitem" className="rx-bring-items-platform">
              {platform}
            </span>
          ))}
        </div>

        <Link
          href={IMPORT_WIZARD_PATH}
          className={cn(
            "rx-bring-items-banner__cta",
            buttonVariants.primary,
            buttonSizes.md,
            focusRing,
          )}
        >
          Bring Your Items
        </Link>
      </div>
    </section>
  );
});
