import { createClient } from "@/lib/supabase/server";
import { listSavedItems } from "@/lib/saved/store";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import { getTrustDashboardData } from "@/lib/trust/service";
import { buildAccountProfileView } from "@/lib/account-center/derive";
import type { UserProfile } from "@/lib/profile/types";

export type AccountHubSnapshot = {
  listings: number;
  saved: number;
  orders: number;
  rating: number;
  reviewCount: number;
  followers: number;
  following: number;
};

async function countFollowing(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("seller_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);
  return count ?? 0;
}

export async function fetchAccountHubSnapshot(profile: UserProfile): Promise<AccountHubSnapshot> {
  const [savedItems, buyerOrders, sellerOrders, trustData, following] = await Promise.all([
    listSavedItems(profile.id).catch(() => []),
    fetchOrdersForUser(profile.id, "buyer").catch(() => []),
    fetchOrdersForUser(profile.id, "seller").catch(() => []),
    getTrustDashboardData(profile.id, profile.verified).catch(() => null),
    countFollowing(profile.id).catch(() => 0),
  ]);

  const profileView = trustData ? buildAccountProfileView(profile, trustData) : null;

  return {
    listings: profile.sellerStats?.listings ?? 0,
    saved: savedItems.length,
    orders: buyerOrders.length + sellerOrders.length,
    rating: profileView?.rating ?? 0,
    reviewCount: profileView?.reviewCount ?? 0,
    followers: profile.sellerStats?.followers ?? profileView?.followers ?? 0,
    following,
  };
}
