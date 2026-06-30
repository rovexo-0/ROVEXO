import { createClient } from "@/lib/supabase/server";

export async function isSubscribedToAuctionLaunch(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auction_launch_subscribers")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

export async function subscribeToAuctionLaunch(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("auction_launch_subscribers").insert({ user_id: userId });

  if (!error) {
    return true;
  }

  if (error.code === "23505") {
    return true;
  }

  return false;
}
