"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { focusRing } from "@/components/ui/tokens";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { cn } from "@/lib/cn";

export function RovexoBanner() {
  return (
    <section aria-labelledby="premium-bring-listings-heading" className="home-v1-import-banner-section">
      <div className="home-v1-import-banner">
        <div className="home-v1-import-banner__content">
          <div className="home-v1-import-banner__copy">
            <h2 id="premium-bring-listings-heading" className="home-v1-import-banner__title">
              Bring Your Listings
            </h2>
            <p className="home-v1-import-banner__subtitle">
              Import listings from other marketplaces in under 60 seconds.
            </p>
          </div>

          <Link
            href={BRING_YOUR_ITEM_PATH}
            className={cn("home-v1-import-banner__cta", focusRing)}
          >
            Import Listings
            <RovexoIcon icon={RovexoIcons.actions["arrow-right"]} size={16} className="home-v1-import-banner__cta-icon" />
          </Link>
        </div>
      </div>
    </section>
  );
}
