"use client";

import { memo } from "react";
import { TagLineIcon, TruckLineIcon } from "@/components/icons/RvxLineIcons";
import { formatListingDispatchLabel, humanizeListingCondition } from "@/lib/listing-card/format";

type ProductListingAttributeColumnsProps = {
  condition?: string | null;
  brand?: string | null;
  dispatchTimeDays?: number | null;
};

function ConditionIcon() {
  return (
    <svg className="pd-v1__attr-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 8.5 12 5l7.5 3.5v7L12 19l-7.5-3.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 12.2 4.7 8.7M12 12.2v6.6M12 12.2 19.3 8.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Listing Detail attributes — Condition · Brand · Dispatch only.
 * Dynamic values; no view count.
 */
export const ProductListingAttributeColumns = memo(function ProductListingAttributeColumns({
  condition,
  brand,
  dispatchTimeDays,
}: ProductListingAttributeColumnsProps) {
  const conditionValue = humanizeListingCondition(condition ?? undefined) ?? "—";
  const brandValue = brand?.trim() || "—";
  const dispatchValue = formatListingDispatchLabel(dispatchTimeDays);

  return (
    <section className="pd-v1__attrs" aria-label="Listing details" data-pd-attrs="condition-brand-dispatch">
      <div className="pd-v1__attr">
        <ConditionIcon />
        <span className="pd-v1__attr-label">Condition</span>
        <span className="pd-v1__attr-value">{conditionValue}</span>
      </div>
      <div className="pd-v1__attr">
        <TagLineIcon className="pd-v1__attr-icon" aria-hidden />
        <span className="pd-v1__attr-label">Brand</span>
        <span className="pd-v1__attr-value">{brandValue}</span>
      </div>
      <div className="pd-v1__attr">
        <TruckLineIcon className="pd-v1__attr-icon" aria-hidden />
        <span className="pd-v1__attr-label">Dispatch</span>
        <span className="pd-v1__attr-value">{dispatchValue}</span>
      </div>
    </section>
  );
});
