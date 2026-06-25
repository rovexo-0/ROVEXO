import type { BuyerPreferencesInput } from "@/lib/account/schemas";
import { createClient } from "@/lib/supabase/server";

export type BuyerPreferences = BuyerPreferencesInput;

const DEFAULTS: BuyerPreferences = {
  saveSearchAlerts: true,
  orderUpdatesPush: true,
  orderUpdatesEmail: true,
  showRecommendations: true,
  region: "Ireland",
  preferredCategorySlugs: [],
};

type BuyerPreferencesRow = {
  save_search_alerts: boolean;
  order_updates_push: boolean;
  order_updates_email: boolean;
  show_recommendations: boolean;
  region: string;
  preferred_category_slugs: string[];
};

function mapRow(row: BuyerPreferencesRow): BuyerPreferences {
  return {
    saveSearchAlerts: row.save_search_alerts,
    orderUpdatesPush: row.order_updates_push,
    orderUpdatesEmail: row.order_updates_email,
    showRecommendations: row.show_recommendations,
    region: row.region,
    preferredCategorySlugs: row.preferred_category_slugs ?? [],
  };
}

export async function getBuyerPreferences(userId: string): Promise<BuyerPreferences> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("buyer_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data ? mapRow(data as BuyerPreferencesRow) : DEFAULTS;
}

export async function updateBuyerPreferences(
  userId: string,
  input: BuyerPreferences,
): Promise<BuyerPreferences> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buyer_preferences")
    .upsert({
      user_id: userId,
      save_search_alerts: input.saveSearchAlerts,
      order_updates_push: input.orderUpdatesPush,
      order_updates_email: input.orderUpdatesEmail,
      show_recommendations: input.showRecommendations,
      region: input.region,
      preferred_category_slugs: input.preferredCategorySlugs,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as BuyerPreferencesRow);
}
