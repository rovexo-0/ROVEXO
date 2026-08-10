/**
 * ROVEXO Follow Engine v1.0 — implementation SSOT
 * ONE table (user_follows) · ONE API (/api/follows)
 * Followers = rows where following_id = user
 * Following = rows where follower_id = user
 * Never use profiles.follower_count / following_count as truth.
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { isMarketplaceFollowAuthorized } from "@/lib/social/social-system-removal-v1";

export type FollowCounts = {
  followerCount: number;
  followingCount: number;
};

export type FollowListItem = {
  id: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
  isFollowing: boolean;
};

type FollowWriteResult = { ok: true } | { error: string; code?: string };

function assertFollowAuthorized(): void {
  if (!isMarketplaceFollowAuthorized()) {
    throw new Error("Marketplace Follow is not authorized.");
  }
}

function mapFollowWriteError(error: { code?: string; message?: string }): FollowWriteResult {
  if (error.code === "23505") return { ok: true };
  if (error.code === "23514") return { error: "You cannot follow yourself.", code: error.code };
  if (error.code === "42P01" || error.code === "PGRST205") {
    return { error: "Follow storage is not ready.", code: error.code };
  }
  if (error.code === "42501" || error.code === "PGRST301") {
    return { error: "Follow permission denied.", code: error.code };
  }
  return { error: "Unable to follow.", code: error.code };
}

async function getWriteClient() {
  const admin = tryCreateAdminClient();
  if (admin) return admin;
  return await createClient();
}

/**
 * SSOT counts = number of rows in user_follows only.
 * Fail-closed to zero if the table is unavailable (never profile columns).
 */
export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  if (!userId) return { followerCount: 0, followingCount: 0 };
  const client = await getWriteClient();

  const [followersRes, followingRes] = await Promise.all([
    client
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId),
    client
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);

  if (followersRes.error || followingRes.error) {
    return { followerCount: 0, followingCount: 0 };
  }

  return {
    followerCount: followersRes.count ?? 0,
    followingCount: followingRes.count ?? 0,
  };
}

export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) return false;
  const client = await getWriteClient();
  const { data } = await client
    .from("user_follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data);
}

export async function followUser(
  followerId: string,
  followingId: string,
): Promise<FollowWriteResult> {
  assertFollowAuthorized();
  if (!followingId) return { error: "User not found." };
  if (followerId === followingId) return { error: "You cannot follow yourself." };

  const client = await getWriteClient();

  const { data: target } = await client
    .from("profiles")
    .select("id")
    .eq("id", followingId)
    .maybeSingle();
  if (!target) return { error: "User not found." };

  const { error } = await client.from("user_follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });

  if (error) return mapFollowWriteError(error);
  return { ok: true };
}

export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<FollowWriteResult> {
  assertFollowAuthorized();
  if (!followingId) return { error: "User not found." };
  if (followerId === followingId) return { error: "You cannot unfollow yourself." };

  const client = await getWriteClient();
  const { error } = await client
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) {
    if (error.code === "42P01") return { error: "Follow storage is not ready.", code: error.code };
    return { error: "Unable to unfollow.", code: error.code };
  }
  return { ok: true };
}

export async function listFollowers(
  userId: string,
  viewerId: string | null,
  opts: { limit?: number; offset?: number; q?: string } = {},
): Promise<FollowListItem[]> {
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const offset = Math.max(0, opts.offset ?? 0);
  const client = await getWriteClient();
  const { data: rows } = await client
    .from("user_follows")
    .select("follower_id, created_at")
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const ids = (rows ?? []).map((r) => r.follower_id as string);
  return hydrateFollowList(ids, viewerId, opts.q);
}

export async function listFollowing(
  userId: string,
  viewerId: string | null,
  opts: { limit?: number; offset?: number; q?: string } = {},
): Promise<FollowListItem[]> {
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const offset = Math.max(0, opts.offset ?? 0);
  const client = await getWriteClient();

  const { data: rows } = await client
    .from("user_follows")
    .select("following_id, created_at")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const ids = (rows ?? []).map((r) => r.following_id as string);
  return hydrateFollowList(ids, viewerId, opts.q);
}

async function hydrateFollowList(
  userIds: string[],
  viewerId: string | null,
  q?: string,
): Promise<FollowListItem[]> {
  if (userIds.length === 0) return [];
  const client = await getWriteClient();

  const { data: profiles } = await client
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  const { data: sellers } = await client
    .from("seller_profiles")
    .select("id, rating, review_count")
    .in("id", userIds);

  const sellerMap = new Map((sellers ?? []).map((s) => [s.id as string, s] as const));

  let viewerFollowing = new Set<string>();
  if (viewerId) {
    const { data: mine } = await client
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", viewerId)
      .in("following_id", userIds);
    viewerFollowing = new Set((mine ?? []).map((r) => r.following_id as string));
  }

  const query = q?.trim().toLowerCase() ?? "";
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p] as const));

  return userIds
    .map((id) => {
      const p = byId.get(id);
      if (!p) return null;
      const username = String(p.username ?? "");
      if (query && !username.toLowerCase().includes(query)) {
        return null;
      }
      const seller = sellerMap.get(id);
      return {
        id,
        username,
        avatarUrl: (p.avatar_url as string | null) ?? null,
        rating: Number(seller?.rating ?? 0),
        reviewCount: Number(seller?.review_count ?? 0),
        isFollowing: viewerFollowing.has(id),
      } satisfies FollowListItem;
    })
    .filter((row): row is FollowListItem => row != null);
}

export async function updateFollowNotificationPrefs(
  followerId: string,
  followingId: string,
  prefs: Partial<{
    notifyNewListings: boolean;
    notifyPriceDrops: boolean;
    notifySoldItems: boolean;
    notifyUserReturns: boolean;
  }>,
): Promise<{ ok: true } | { error: string }> {
  assertFollowAuthorized();
  const client = await getWriteClient();
  const { error } = await client
    .from("user_follows")
    .update({
      notify_new_listings: prefs.notifyNewListings,
      notify_price_drops: prefs.notifyPriceDrops,
      notify_sold_items: prefs.notifySoldItems,
      notify_user_returns: prefs.notifyUserReturns,
      updated_at: new Date().toISOString(),
    })
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) return { error: "Unable to save preferences." };
  return { ok: true };
}

/** Read per-edge Follow notification prefs (DB SSOT on user_follows). */
export async function getFollowEdgeNotificationPrefs(
  followerId: string,
  followingId: string,
): Promise<{
  notifyNewListings: boolean;
  notifyPriceDrops: boolean;
  notifySoldItems: boolean;
  notifyUserReturns: boolean;
} | null> {
  assertFollowAuthorized();
  const client = await getWriteClient();
  const { data } = await client
    .from("user_follows")
    .select(
      "notify_new_listings, notify_price_drops, notify_sold_items, notify_user_returns",
    )
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (!data) return null;
  return {
    notifyNewListings: data.notify_new_listings !== false,
    notifyPriceDrops: data.notify_price_drops !== false,
    notifySoldItems: data.notify_sold_items !== false,
    notifyUserReturns: data.notify_user_returns !== false,
  };
}
