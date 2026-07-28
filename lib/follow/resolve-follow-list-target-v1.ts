/**
 * Lightweight target resolve for Followers / Following pages.
 * Performance only — returns id + username without loading the full public profile.
 * Profile username is resolved first (hot path from View Profile stats).
 */

import { createClient } from "@/lib/supabase/server";
import { resolveStoreByRouteParam } from "@/lib/store/store-repository";

export type FollowListTarget = {
  userId: string;
  username: string;
};

export async function resolveFollowListTarget(
  routeParam: string,
): Promise<FollowListTarget | null> {
  const value = routeParam?.trim() ?? "";
  if (!value) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", value.toLowerCase())
    .maybeSingle();

  if (profile?.id && profile.username) {
    return { userId: profile.id, username: profile.username };
  }

  const store = await resolveStoreByRouteParam(value).catch(() => null);
  if (store?.sellerId) {
    return { userId: store.sellerId, username: store.storeSlug };
  }

  return null;
}
