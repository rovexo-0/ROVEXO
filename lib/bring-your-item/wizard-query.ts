import { MIGRATION_PLATFORM_IDS } from "@/lib/seller/migration/constants";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export type BringYourItemWizardQuery = {
  initialPlatform: MigrationPlatformId | null;
  resumeJobId: string | null;
  oauthConnected: boolean;
  oauthFailed: boolean;
  oauthUnconfigured: boolean;
  shopRequired: boolean;
};

function parsePlatform(value: string | null): MigrationPlatformId | null {
  if (!value) return null;
  return (MIGRATION_PLATFORM_IDS as readonly string[]).includes(value)
    ? (value as MigrationPlatformId)
    : null;
}

export function parseBringYourItemWizardQuery(searchParams: URLSearchParams): BringYourItemWizardQuery {
  return {
    initialPlatform: parsePlatform(searchParams.get("platform")),
    resumeJobId: searchParams.get("job")?.trim() || null,
    oauthConnected: searchParams.get("connected") === "1",
    oauthFailed: searchParams.get("oauth") === "failed",
    oauthUnconfigured: searchParams.get("oauth") === "unconfigured",
    shopRequired: searchParams.get("oauth") === "shop_required",
  };
}

export function clearWizardQueryKeys(keys: string[]): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  for (const key of keys) url.searchParams.delete(key);
  return `${url.pathname}${url.search}`;
}
