"use client";

/**
 * Store Showcase analytics — high-level exposure only.
 * Never renders decay %, day math, or row calculations.
 */

import type { StoreShowcaseAnalyticsSnapshot } from "@/lib/promote/store-showcase-analytics";

export type StoreAnalyticsProps = {
  snapshot: StoreShowcaseAnalyticsSnapshot;
};

export function StoreAnalytics({ snapshot }: StoreAnalyticsProps) {
  return (
    <section className="store-showcase-v1__analytics" data-store-showcase-analytics="v1.0">
      <h3 className="store-showcase-v1__analytics-title">Store exposure</h3>
      <p className="store-showcase-v1__status">Status: {snapshot.statusLabel}</p>
      <ul className="store-showcase-v1__metrics">
        <li>
          <span>Impressions</span>
          <strong>{snapshot.impressions.toLocaleString("en-GB")}</strong>
        </li>
        <li>
          <span>Store views</span>
          <strong>{snapshot.storeViews.toLocaleString("en-GB")}</strong>
        </li>
        <li>
          <span>Listing views</span>
          <strong>{snapshot.listingViews.toLocaleString("en-GB")}</strong>
        </li>
        <li>
          <span>Profile views</span>
          <strong>{snapshot.profileViews.toLocaleString("en-GB")}</strong>
        </li>
      </ul>
    </section>
  );
}
