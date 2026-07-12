/** Canonical Promotion Engine — statuses, sources, and admin durations (v1.0). */

export const PROMOTION_STATUSES = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "expired",
  "cancelled",
  "revoked",
  "completed",
] as const;

export type CanonicalPromotionStatus = (typeof PROMOTION_STATUSES)[number];

export const PROMOTION_SOURCES = [
  "purchased",
  "granted_by_rovexo",
  "compensation",
  "launch_campaign",
  "support",
  "marketing",
  "beta_testing",
  "internal",
] as const;

export type PromotionSource = (typeof PROMOTION_SOURCES)[number];

export const PROMOTION_SOURCE_LABELS: Record<PromotionSource, string> = {
  purchased: "Purchased",
  granted_by_rovexo: "Granted by ROVEXO",
  compensation: "Compensation",
  launch_campaign: "Launch Campaign",
  support: "Support",
  marketing: "Marketing",
  beta_testing: "Beta Testing",
  internal: "Internal",
};

export type AdminDurationOption = {
  id: string;
  label: string;
  days: number | null;
};

export const ADMIN_DURATION_OPTIONS: AdminDurationOption[] = [
  { id: "1d", label: "1 Day", days: 1 },
  { id: "3d", label: "3 Days", days: 3 },
  { id: "7d", label: "7 Days", days: 7 },
  { id: "14d", label: "14 Days", days: 14 },
  { id: "28d", label: "28 Days", days: 28 },
  { id: "60d", label: "60 Days", days: 60 },
  { id: "90d", label: "90 Days", days: 90 },
  { id: "180d", label: "180 Days", days: 180 },
  { id: "365d", label: "365 Days", days: 365 },
  { id: "unlimited", label: "Unlimited", days: 36500 },
  { id: "custom", label: "Custom", days: null },
];

export function resolveAdminDurationDays(packageId: string, customDays?: number): number | null {
  if (packageId === "custom") {
    if (!customDays || customDays <= 0) return null;
    return Math.floor(customDays);
  }
  const option = ADMIN_DURATION_OPTIONS.find((entry) => entry.id === packageId);
  if (option) return option.days;
  const numeric = Number(packageId);
  if (Number.isFinite(numeric) && numeric > 0) return Math.floor(numeric);
  return null;
}

/** Map DB status values to canonical admin labels. */
export function toCanonicalStatus(dbStatus: string): CanonicalPromotionStatus {
  const map: Record<string, CanonicalPromotionStatus> = {
    pending: "draft",
    scheduled: "scheduled",
    active: "active",
    paused: "paused",
    suspended: "paused",
    expired: "expired",
    failed: "cancelled",
    revoked: "revoked",
    cancelled: "cancelled",
    completed: "completed",
  };
  return map[dbStatus] ?? "draft";
}

export function toDbStatus(canonical: CanonicalPromotionStatus): string {
  const map: Record<CanonicalPromotionStatus, string> = {
    draft: "pending",
    scheduled: "scheduled",
    active: "active",
    paused: "paused",
    expired: "expired",
    cancelled: "failed",
    revoked: "revoked",
    completed: "expired",
  };
  return map[canonical];
}

export type AdminPromotionAction =
  | "grant"
  | "activate"
  | "schedule"
  | "pause"
  | "resume"
  | "extend"
  | "reduce"
  | "expire"
  | "revoke"
  | "duplicate"
  | "clone";

export type PromotionScope = "listing" | "seller";
