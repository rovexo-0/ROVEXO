"use client";

import { useState } from "react";
import { PromotionCard } from "@/components/promotions/cards-v1/PromotionCard";
import { PromotionListingPicker } from "@/components/promotions/cards-v1/PromotionListingPicker";
import { PromotionTrustFooter } from "@/components/promotions/cards-v1/PromotionTrustFooter";
import { AccountCanonicalShell } from "@/features/account-canonical";
import type { PromotionToolMenuItem } from "@/lib/account-center/promotion-tools";
import type { ResolvedPromotionCatalog, ResolvedPromotionCatalogEntry } from "@/lib/promotions/catalog";
import type { SellerListing } from "@/lib/listings/types";

type PromotionToolEntryV1Props = {
  menuItem: PromotionToolMenuItem;
  entry: ResolvedPromotionCatalogEntry;
  trustItems: ResolvedPromotionCatalog["trustItems"];
  listings: SellerListing[];
};

export function PromotionToolEntryV1({
  menuItem,
  entry,
  trustItems,
  listings,
}: PromotionToolEntryV1Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <AccountCanonicalShell title={menuItem.title} backHref="/account/promotion-tools">
      <div className="promo-v1" data-promotion-tools-entry-version="v1.0-production">
        <div className="promo-v1__shell">
          <section aria-label={menuItem.title} className="promo-v1__grid" data-testid="promotion-tool-entry">
            <PromotionCard entry={entry} onSelect={() => setPickerOpen(true)} />
          </section>
          <PromotionTrustFooter items={trustItems} />
        </div>
        <PromotionListingPicker
          open={pickerOpen}
          entry={entry}
          listings={listings}
          onClose={() => setPickerOpen(false)}
        />
      </div>
    </AccountCanonicalShell>
  );
}
