import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { listBusinessDirectory, type BusinessDirectoryEntry } from "@/lib/business/directory";

async function notifyNewFollower(sellerId: string, followerId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: follower } = await admin
      .from("profiles")
      .select("username, full_name")
      .eq("id", followerId)
      .maybeSingle();

    const name = follower?.full_name || follower?.username || "Someone";
    await dispatchNotification({
      userId: sellerId,
      type: "follower",
      title: "New follower",
      subtitle: `${name} started following your shop`,
      href: follower?.username ? `/user/${follower.username}` : "/seller/dashboard",
    });
  } catch {
    // Non-blocking
  }
}

export async function followSeller(followerId: string, sellerId: string): Promise<boolean> {
  if (followerId === sellerId) return false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("seller_follows").upsert({ follower_id: followerId, seller_id: sellerId });
    if (error) return false;
    await notifyNewFollower(sellerId, followerId);
    return true;
  } catch {
    return false;
  }
}

export async function unfollowSeller(followerId: string, sellerId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("seller_follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("seller_id", sellerId);
    return !error;
  } catch {
    return false;
  }
}

export async function isFollowingSeller(followerId: string, sellerId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("seller_follows")
      .select("seller_id")
      .eq("follower_id", followerId)
      .eq("seller_id", sellerId)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function listFollowedSellerIds(followerId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("seller_follows").select("seller_id").eq("follower_id", followerId);
    return ((data as Array<{ seller_id: string }> | null) ?? []).map((row) => row.seller_id);
  } catch {
    return [];
  }
}

export async function getRecommendedBusinesses(limit = 6): Promise<BusinessDirectoryEntry[]> {
  const directory = await listBusinessDirectory(limit * 2);
  return directory
    .filter((entry) => entry.verifiedBusiness || entry.trustScore >= 55)
    .slice(0, limit);
}
