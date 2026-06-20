import { SavedPage } from "@/features/saved/components/SavedPage";
import { fetchSavedItems } from "@/lib/saved/queries";

export default async function SavedRoute() {
  const items = await fetchSavedItems();

  return <SavedPage initialItems={items} />;
}
