import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";

export async function isSellerOnVacation(
  client: SupabaseClient<Database>,
  sellerId: string,
): Promise<boolean> {
  const { data } = await client
    .from("user_settings")
    .select("vacation_mode")
    .eq("user_id", sellerId)
    .maybeSingle();

  return Boolean(data?.vacation_mode);
}
