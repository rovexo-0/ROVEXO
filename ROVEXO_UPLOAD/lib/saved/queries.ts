import { listSavedItems, removeSavedItems } from "@/lib/saved/store";
import type { SavedItem } from "@/lib/saved/types";
import { requireAuthContext } from "@/lib/auth/session";

export async function fetchSavedItems(): Promise<SavedItem[]> {
  const { user } = await requireAuthContext();
  return listSavedItems(user.id);
}

export async function removeSaved(productSlugs: string[]): Promise<SavedItem[]> {
  const { user } = await requireAuthContext();
  return removeSavedItems(user.id, productSlugs);
}
