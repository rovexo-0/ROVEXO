import { SavedItemsV1 } from "@/features/account-module/components/SavedItemsV1";
import { fetchSavedItems } from "@/lib/saved/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function SavedRoute() {
  const items = await fetchSavedItems();

  return <SavedItemsV1 initialItems={items} />;
}
