import "server-only";

import { getProfile } from "@/lib/profile/data";
import {
  loadBusinessStatus,
  switchSellerContext,
  type BusinessStatusSnapshot,
} from "@/lib/business/business-onboarding-v1";
import { resolveStoreHrefFromSeller } from "@/lib/store/store-href";
import type { SellerContext } from "@/lib/seller-context/seller-context-v1";
import type { UserProfile } from "@/lib/profile/types";

export async function loadPwaBusinessSession(): Promise<{
  profile: UserProfile;
  status: BusinessStatusSnapshot;
}> {
  const profile = await getProfile();
  const status = await loadBusinessStatus(profile.id);
  return { profile, status };
}

export function resolveBusinessStoreHref(profile: UserProfile): string {
  return (
    resolveStoreHrefFromSeller({
      sellerId: profile.id,
      storeSlug: profile.username,
    }) ?? `/store/${encodeURIComponent(profile.username || profile.id)}`
  );
}

export async function activateBusinessContext(
  userId: string,
  currentContext?: SellerContext,
): Promise<void> {
  if (currentContext === "business") return;
  await switchSellerContext(userId, "business");
}
