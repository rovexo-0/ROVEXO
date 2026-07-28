"use client";

import { PremiumButtonLink } from "@/components/ui/PremiumButton";
import css from "@/components/homepage/canonical/CanonicalHomepage.module.css";

type HomepageEmptyStateProps = {
  variant: "listings" | "recommendations";
};

/**
 * Absolute Law v5.0 — empty DB shows marketplace empty copy only.
 * Never inject fake / demo / placeholder listings.
 */
export function HomepageEmptyState({ variant }: HomepageEmptyStateProps) {
  if (variant === "recommendations") {
    return (
      <div
        className={css.emptyState}
        role="status"
        data-hp-empty={variant}
        data-homepage-empty={variant}
      >
        <h2 className={css.emptyTitle}>No Recommendations Yet</h2>
        <p className={css.emptyDescription}>
          Personalised picks will appear when real listings are available.
        </p>
      </div>
    );
  }

  return (
    <div
      className={css.emptyState}
      role="status"
      data-hp-empty="listings"
      data-homepage-empty="listings"
      data-homepage-listing-container="empty"
      data-real-products-only="v5.0"
    >
      <p className={css.emptyDescription}>ROVEXO MARKETPLACE</p>
      <h2 className={css.emptyTitle}>No listings available.</h2>
      <p className={css.emptyDescription}>Be the first to sell on ROVEXO.</p>
      <PremiumButtonLink href="/sell" variant="primary" fullWidth>
        SELL NOW
      </PremiumButtonLink>
    </div>
  );
}
