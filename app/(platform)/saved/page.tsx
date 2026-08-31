import { SavedItemsV1 } from "@/features/account-module/components/SavedItemsV1";
import { fetchSavedItems } from "@/lib/saved/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
/* P0.3 — grid CSS on server route so first paint is 2-col (not client-chunk delayed). */
import "@/styles/rovexo/listing-grid-v1.css";

export const metadata = privatePageMetadata;

/** LIVE production Saved route — server list → SavedItemsV1 initialItems */
export default async function SavedRoute() {
  const items = await fetchSavedItems();
  return <SavedItemsV1 initialItems={items} />;
}
