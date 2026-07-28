/**
 * ROVEXO STORE SHOWCASE — Analytics helpers v1.0.
 * High-level exposure metrics only. Never expose decay / row math to users.
 */

export type StoreShowcaseAnalyticsSnapshot = {
  impressions: number;
  storeViews: number;
  listingViews: number;
  profileViews: number;
  isActive: boolean;
  /** User-safe status label only. */
  statusLabel: "Active" | "Expired" | "Inactive" | "Waiting";
};

export function buildStoreShowcaseAnalyticsSnapshot(input: {
  impressions?: number;
  storeViews?: number;
  listingViews?: number;
  profileViews?: number;
  isActive?: boolean;
  isWaiting?: boolean;
  isExpired?: boolean;
}): StoreShowcaseAnalyticsSnapshot {
  let statusLabel: StoreShowcaseAnalyticsSnapshot["statusLabel"] = "Inactive";
  if (input.isActive) statusLabel = "Active";
  else if (input.isWaiting) statusLabel = "Waiting";
  else if (input.isExpired) statusLabel = "Expired";

  return {
    impressions: Math.max(0, Math.floor(input.impressions ?? 0)),
    storeViews: Math.max(0, Math.floor(input.storeViews ?? 0)),
    listingViews: Math.max(0, Math.floor(input.listingViews ?? 0)),
    profileViews: Math.max(0, Math.floor(input.profileViews ?? 0)),
    isActive: Boolean(input.isActive),
    statusLabel,
  };
}
