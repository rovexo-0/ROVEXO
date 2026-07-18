"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { useState } from "react";
import { MegaphoneLineIcon } from "@/components/icons/RvxLineIcons";
import { PromotionListingPicker } from "@/components/promotions/cards-v1/PromotionListingPicker";
import { PromotionPackagePicker } from "@/components/promotions/cards-v1/PromotionPackagePicker";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { AccountPageStack } from "@/features/account-canonical";
import type { ResolvedPromotionCatalogEntry, PromotionTrustItem } from "@/lib/promotions/catalog";
import type { SellerListing } from "@/lib/listings/types";

type PromotionToolsV1Props = {
  entries: ResolvedPromotionCatalogEntry[];
  trustItems: PromotionTrustItem[];
  listings: SellerListing[];
  backHref?: string;
  backLabel?: string;
};

export function PromotionToolsV1({
  entries,
  trustItems,
  listings,
  backHref = "/seller",
  backLabel = "Selling",
}: PromotionToolsV1Props) {
  const [selectedEntry, setSelectedEntry] = useState<ResolvedPromotionCatalogEntry | null>(null);
  const [listingPickerOpen, setListingPickerOpen] = useState(false);
  const [packagePickerOpen, setPackagePickerOpen] = useState(false);
  const [storeCheckoutBusy, setStoreCheckoutBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (entry: ResolvedPromotionCatalogEntry) => {
    setError(null);

    if (entry.id === "boost") {
      setPackagePickerOpen(true);
      return;
    }

    if (entry.checkoutKind === "store_featured") {
      setStoreCheckoutBusy(true);
      try {
        const response = await fetch("/api/promotions/seller-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "store_featured", packageId: "7d" }),
        });
        const payload = (await response.json()) as { success?: boolean; url?: string; error?: string };
        if (!response.ok || !payload.url) {
          setError(payload.error ?? "Unable to start checkout.");
          return;
        }
        window.location.assign(payload.url);
      } catch {
        setError("Unable to start checkout.");
      } finally {
        setStoreCheckoutBusy(false);
      }
      return;
    }

    setSelectedEntry(entry);
    setListingPickerOpen(true);
  };

  return (
    <AccountCanonicalShell title="Promotions" backHref={backHref} backLabel={backLabel} showHeaderTitle>
      <AccountPageStack>
        <CanonicalSection title="Promotion Tools" intro="Boost visibility for your listings and store.">
          <CanonicalCard variant="list" data-testid="promotion-tools-grid">
            {entries.map((entry) => (
              <CanonicalMenuRow
                key={entry.id}
                title={entry.title}
                description={entry.description}
                icon={<MegaphoneLineIcon />}
                value={entry.resolvedPriceLabel}
                onClick={() => void handleSelect(entry)}
                disabled={storeCheckoutBusy && entry.id === "store_featured"}
              />
            ))}
          </CanonicalCard>
        </CanonicalSection>

        {trustItems.length ? (
          <CanonicalSection title="Why promote">
            <CanonicalCard variant="list">
              {trustItems.map((item) => (
                <CanonicalMenuRow
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  icon={<MegaphoneLineIcon />}
                />
              ))}
            </CanonicalCard>
          </CanonicalSection>
        ) : null}

        {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}

        <PromotionListingPicker
          open={listingPickerOpen}
          entry={selectedEntry}
          listings={listings}
          onClose={() => setListingPickerOpen(false)}
        />
        <PromotionPackagePicker open={packagePickerOpen} onClose={() => setPackagePickerOpen(false)} />
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}
