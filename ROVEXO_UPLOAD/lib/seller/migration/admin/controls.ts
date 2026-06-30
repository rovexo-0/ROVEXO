/**
 * Super Admin migration controls — architecture stub for future implementation.
 * Sellers use seller-scoped APIs; admin overrides will route through this layer.
 */

export type AdminMigrationPolicy = {
  maxJobsPerSeller: number;
  maxItemsPerJob: number;
  publishEnabled: boolean;
  autoPublishDefault: boolean;
  allowedPlatforms: string[] | "all";
};

export const DEFAULT_ADMIN_MIGRATION_POLICY: AdminMigrationPolicy = {
  maxJobsPerSeller: 50,
  maxItemsPerJob: 10_000,
  publishEnabled: true,
  autoPublishDefault: false,
  allowedPlatforms: "all",
};

/** Reserved for Super Admin dashboard — not wired in Module 3. */
export function resolveAdminMigrationPolicy(): AdminMigrationPolicy {
  return DEFAULT_ADMIN_MIGRATION_POLICY;
}
