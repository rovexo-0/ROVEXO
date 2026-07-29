"use client";

import dynamic from "next/dynamic";

/**
 * ROVEXO Owner UI Lock — Global Empty State (Search & Browse)
 * Illustration: Teddy Empty State Engine v1.1 Static Premium (lazy).
 * Accessible title remains "No products found" (sr-only).
 * No CTAs, chips, helpers, or recovery links.
 */

type MarketplaceNoProductsEmptyProps = {
  className?: string;
};

const TeddyEmptyState = dynamic(
  () =>
    import("@/components/empty-state/TeddyEmptyState").then((mod) => mod.TeddyEmptyState),
  {
    ssr: false,
    loading: () => null,
  },
);

export function MarketplaceNoProductsEmpty({ className }: MarketplaceNoProductsEmptyProps) {
  return (
    <div
      className={["rx-mkt-empty", className].filter(Boolean).join(" ")}
      data-empty-state="no-products-v1"
      role="status"
      aria-live="polite"
    >
      <TeddyEmptyState visible />
      <p className="sr-only">No products found</p>
    </div>
  );
}
