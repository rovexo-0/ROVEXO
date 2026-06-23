/** Public listing URL used for share actions (v1.0). */
export const LISTING_SHARE_ORIGIN = "https://rovexo.co.uk";

export function getListingShareUrl(slug: string): string {
  const normalized = slug.replace(/^\/+/, "").trim();
  return `${LISTING_SHARE_ORIGIN}/listing/${normalized}`;
}
