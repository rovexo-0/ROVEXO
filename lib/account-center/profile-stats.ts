import { createClient } from "@/lib/supabase/server";
import { ACCOUNT_HUB_ACTIVE_ORDER_STATUSES } from "@/lib/account-center/constants";

export type AccountReviewSummary = {
  rating: number;
  reviewCount: number;
};

/** Published listings with stock — excludes draft, paused, sold, and deleted. */
export async function countAccountActiveListings(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", userId)
    .eq("status", "published")
    .gt("stock", 0);

  return count ?? 0;
}

export async function countAccountSavedItems(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("saved_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
}

export async function countAccountActiveOrders(userId: string): Promise<number> {
  const supabase = await createClient();
  const statuses = [...ACCOUNT_HUB_ACTIVE_ORDER_STATUSES];

  const [{ count: buyerCount }, { count: sellerCount }] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .in("status", statuses),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", userId)
      .in("status", statuses),
  ]);

  return (buyerCount ?? 0) + (sellerCount ?? 0);
}

/** Average rating + count from the canonical seller_profiles review aggregate. */
export async function getAccountReviewSummary(userId: string): Promise<AccountReviewSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seller_profiles")
    .select("rating, review_count")
    .eq("id", userId)
    .maybeSingle();

  return {
    rating: Number(data?.rating ?? 0),
    reviewCount: data?.review_count ?? 0,
  };
}

export async function countAccountFollowers(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("seller_follows")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", userId);

  return count ?? 0;
}

export async function countAccountFollowing(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("seller_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  return count ?? 0;
}
