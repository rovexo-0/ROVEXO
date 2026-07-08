import type { ParcelStatus, ParcelStatusMeta } from "@/features/commerce-ui/lib/status";

/** Canonical GBP currency formatter for all commerce-ui surfaces. */
export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Re-exported for convenience so callers only import from one module.
export type { ParcelStatus, ParcelStatusMeta };
