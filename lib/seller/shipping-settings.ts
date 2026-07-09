import type { SellerShippingSettingsInput } from "@/lib/account/schemas";
import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import { sanitizeText } from "@/lib/account/sanitize";
import { createClient } from "@/lib/supabase/server";

export type SellerShippingSettings = SellerShippingSettingsInput;

const DEFAULTS: SellerShippingSettings = {
  handlingTimeDays: 1,
  dispatchTimeDays: 1,
  baseShippingCost: 0,
  freeShippingThreshold: null,
  defaultCarrier: "Royal Mail",
  shipsTo: UK_DEFAULT_COUNTRY,
  localPickupEnabled: false,
  internationalShippingEnabled: false,
  returnPolicyDays: 14,
};

type SellerShippingRow = {
  handling_time_days: number;
  dispatch_time_days: number;
  base_shipping_cost: number;
  free_shipping_threshold: number | null;
  default_carrier: string;
  ships_to: string;
  local_pickup_enabled: boolean;
  international_shipping_enabled: boolean;
  return_policy_days: number;
};

function mapRow(row: SellerShippingRow): SellerShippingSettings {
  return {
    handlingTimeDays: row.handling_time_days,
    dispatchTimeDays: row.dispatch_time_days,
    baseShippingCost: Number(row.base_shipping_cost),
    freeShippingThreshold: row.free_shipping_threshold,
    defaultCarrier: row.default_carrier,
    shipsTo: row.ships_to,
    localPickupEnabled: row.local_pickup_enabled,
    internationalShippingEnabled: row.international_shipping_enabled,
    returnPolicyDays: row.return_policy_days,
  };
}

export async function getSellerShippingSettings(userId: string): Promise<SellerShippingSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seller_shipping_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data ? mapRow(data as SellerShippingRow) : DEFAULTS;
}

export async function updateSellerShippingSettings(
  userId: string,
  input: SellerShippingSettings,
): Promise<SellerShippingSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seller_shipping_settings")
    .upsert({
      user_id: userId,
      handling_time_days: input.handlingTimeDays,
      dispatch_time_days: input.dispatchTimeDays,
      base_shipping_cost: input.baseShippingCost,
      free_shipping_threshold: input.freeShippingThreshold ?? null,
      default_carrier: sanitizeText(input.defaultCarrier),
      ships_to: sanitizeText(input.shipsTo),
      local_pickup_enabled: input.localPickupEnabled,
      international_shipping_enabled: input.internationalShippingEnabled,
      return_policy_days: input.returnPolicyDays,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as SellerShippingRow);
}
