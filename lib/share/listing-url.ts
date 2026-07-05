import { getAppUrl } from "@/lib/supabase/env";

/** Public listing URL used for share actions. */
export function getListingShareOrigin(): string {
  try {
    return getAppUrl().replace(/\/$/, "");
  } catch {
    return "https://www.rovexo.co.uk";
  }
}

export function getListingShareUrl(slug: string): string {
  const normalized = slug.replace(/^\/+/, "").trim();
  return `${getListingShareOrigin()}/listing/${normalized}`;
}

export function getFacebookShareUrl(listingUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}`;
}
