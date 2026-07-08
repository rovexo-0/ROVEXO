"use client";

import Link from "next/link";
import { useState } from "react";
import { PromotionCard } from "@/components/promotions/cards-v1/PromotionCard";
import { PromotionListingPicker } from "@/components/promotions/cards-v1/PromotionListingPicker";
import { PromotionTrustFooter } from "@/components/promotions/cards-v1/PromotionTrustFooter";
import type { ResolvedPromotionCatalog, ResolvedPromotionCatalogEntry } from "@/lib/promotions/catalog";
import type { SellerListing } from "@/lib/listings/types";

type PromotionCardsPageProps = {
  catalog: ResolvedPromotionCatalog;
  listings: SellerListing[];
};

export function PromotionCardsPage({ catalog, listings }: PromotionCardsPageProps) {
  const [selectedEntry, setSelectedEntry] = useState<ResolvedPromotionCatalogEntry | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelect = (entry: ResolvedPromotionCatalogEntry) => {
    setSelectedEntry(entry);
    setPickerOpen(true);
  };

  return (
    <div className="promo-v1" data-promotion-cards-version="v1.0">
      <div className="promo-v1__shell">
        <header className="promo-v1__header">
          <div>
            <h1 className="promo-v1__title">{catalog.pageTitle}</h1>
            <p className="promo-v1__subtitle">{catalog.pageSubtitle}</p>
          </div>
          <Link href={catalog.howItWorksHref} className="promo-v1__how-it-works">
            <span aria-hidden>▶</span>
            {catalog.howItWorksLabel}
          </Link>
        </header>

        <section
          className="promo-v1__grid"
          aria-label="Promotion options"
          data-testid="promotion-cards-grid"
        >
          {catalog.entries.map((entry) => (
            <PromotionCard key={entry.id} entry={entry} onSelect={handleSelect} />
          ))}
        </section>

        <PromotionTrustFooter items={catalog.trustItems} />
      </div>

      <PromotionListingPicker
        open={pickerOpen}
        entry={selectedEntry}
        listings={listings}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
