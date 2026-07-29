/**
 * ROVEXO Holiday Mode — Global Listing Visibility Engine (Phase I).
 *
 * Seller Visibility State (`user_settings.vacation_mode`) drives public hide.
 * Listings stay published / active — no mass status edits, archive, draft, or delete.
 *
 * SSOT filter used by marketplace discovery (searchListings, homepage feed, etc.).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";

export const HOLIDAY_MODE_VISIBILITY_VERSION = "1.0" as const;

/** Direct listing URL while seller Holiday Mode is ON. */
export const HOLIDAY_MODE_LISTING_UNAVAILABLE_MESSAGE =
  "This listing is temporarily unavailable because the seller has enabled Holiday Mode.";

/** Public seller profile listings empty state while Holiday Mode is ON. */
export const HOLIDAY_MODE_PROFILE_EMPTY_MESSAGE =
  "No active listings available while Holiday Mode is enabled.";

export const HOLIDAY_MODE_ENABLE_CONFIRM = {
  title: "Enable Holiday Mode?",
  body: "Your active listings will be temporarily hidden from buyers until you turn Holiday Mode off.",
  cancel: "Cancel",
  confirm: "Enable",
} as const;

export const HOLIDAY_MODE_DISABLE_CONFIRM = {
  title: "Disable Holiday Mode?",
  body: "Your listings will immediately become visible again.",
  cancel: "Cancel",
  confirm: "Disable",
} as const;

type RowWithSellerId = { seller_id?: string | null };

/**
 * Batch-load seller IDs currently on Holiday Mode.
 * One source of truth: `user_settings.vacation_mode` — never listing rows.
 */
export async function fetchHolidayModeSellerIdSet(
  client: SupabaseClient<Database>,
  sellerIds: string[],
): Promise<Set<string>> {
  const unique = [...new Set(sellerIds.map((id) => id?.trim()).filter(Boolean))] as string[];
  if (unique.length === 0) return new Set();

  const { data, error } = await client
    .from("user_settings")
    .select("user_id")
    .in("user_id", unique)
    .eq("vacation_mode", true);

  if (error || !data?.length) return new Set();
  return new Set(data.map((row) => row.user_id).filter(Boolean));
}

/** Drop marketplace rows whose seller has Holiday Mode ON. */
export function excludeHolidayModeSellerRows<T extends RowWithSellerId>(
  rows: T[],
  holidaySellerIds: Set<string>,
): T[] {
  if (holidaySellerIds.size === 0) return rows;
  return rows.filter((row) => {
    const sellerId = row.seller_id;
    if (!sellerId) return true;
    return !holidaySellerIds.has(sellerId);
  });
}

/**
 * Canonical post-query gate: remove Holiday Mode sellers before eligibility / map.
 * Call from every public discovery query path.
 */
export async function applyHolidayModeVisibilityFilter<T extends RowWithSellerId>(
  client: SupabaseClient<Database>,
  rows: T[],
): Promise<T[]> {
  if (!rows.length) return rows;
  const holidayIds = await fetchHolidayModeSellerIdSet(
    client,
    rows.map((row) => row.seller_id).filter((id): id is string => Boolean(id)),
  );
  return excludeHolidayModeSellerRows(rows, holidayIds);
}
