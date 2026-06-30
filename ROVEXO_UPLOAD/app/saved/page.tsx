import { SavedPage } from "@/features/saved/components/SavedPage";
import { fetchSavedItems } from "@/lib/saved/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function SavedRoute() {
  const items = await fetchSavedItems();

  return <SavedPage initialItems={items} />;
}
