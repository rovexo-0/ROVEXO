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

/** Average rating + count — prefer trigger-maintained seller_profiles aggregates. */
export async function getAccountReviewSummary(userId: string): Promise<AccountReviewSummary> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("seller_profiles")
    .select("rating, review_count")
    .eq("id", userId)
    .maybeSingle();

  const reviewCount = Number(data?.review_count ?? 0);
  if (reviewCount > 0) {
    return {
      rating: Number(data?.rating ?? 0),
      reviewCount,
    };
  }

  // Fallback: compute from reviews when seller_profiles row is missing/stale.
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", userId);

  if (reviews && reviews.length > 0) {
    const sum = reviews.reduce((total, row) => total + Number(row.rating ?? 0), 0);
    return {
      rating: sum / reviews.length,
      reviewCount: reviews.length,
    };
  }

  return { rating: 0, reviewCount: 0 };
}
