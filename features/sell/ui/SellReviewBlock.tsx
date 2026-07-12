"use client";

import { useMemo } from "react";
import { CanonicalCard } from "@/src/components/canonical";
import { useSell } from "@/features/sell/context/SellProvider";
import { calculatePlatformFee } from "@/lib/orders/pricing";
import { formatListingPrice } from "@/lib/listing-card/format";
import { PARCEL_SIZE_OPTIONS } from "@/features/sell/types";

function sellerPricingSummary(priceValue: number) {
  const platformFee = calculatePlatformFee(priceValue);
  const sellerAmount = Math.round(priceValue * 100) / 100;
  return { platformFee, sellerAmount };
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="sell-review-row">
      <div className="min-w-0 flex-1">
        <p className="sell-review-row__label">{label}</p>
        <p className="sell-review-row__value">{value}</p>
      </div>
      <button type="button" className="account-settings-text-action" onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}

export function SellReviewBlock() {
  const { draft } = useSell();

  const priceValue = Number.parseFloat(draft.price.replace(/[^\d.]/g, ""));
  const pricing = useMemo(() => {
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      return { platformFee: "—", youReceive: "—" };
    }
    const { platformFee, sellerAmount } = sellerPricingSummary(priceValue);
    return {
      platformFee: formatListingPrice(platformFee),
      youReceive: formatListingPrice(sellerAmount),
    };
  }, [priceValue]);

  const parcelLabel =
    PARCEL_SIZE_OPTIONS.find((option) => option.id === draft.parcelSize)?.label ?? "Not set";

  const photoSummary =
    draft.photos.length === 0 ? "No photos" : `${draft.photos.length} photo${draft.photos.length === 1 ? "" : "s"}`;

  const detailsSummary = draft.title.trim() || "Add title and description";

  return (
    <CanonicalCard variant="medium" className="sell-review-card">
      <ReviewRow label="Photos" value={photoSummary} onEdit={() => scrollToSection("sell-section-photos")} />
      <ReviewRow
        label="Details"
        value={detailsSummary}
        onEdit={() => scrollToSection("sell-section-details")}
      />
      <ReviewRow
        label="Price"
        value={
          draft.price.trim()
            ? `${formatListingPrice(priceValue)} · Fee ${pricing.platformFee} · You receive ${pricing.youReceive}`
            : "Add price"
        }
        onEdit={() => scrollToSection("sell-section-pricing")}
      />
      <ReviewRow label="Delivery" value={parcelLabel} onEdit={() => scrollToSection("sell-section-delivery")} />
    </CanonicalCard>
  );
}
