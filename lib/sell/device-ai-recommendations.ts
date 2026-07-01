import type { SellListingDraft } from "@/features/sell/types";

export type DeviceAiSuggestion = {
  id: string;
  label: string;
  detail: string;
  kind: "title" | "description" | "photo" | "price" | "category" | "accessibility";
};

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

/** Local, zero-cost heuristics — never blocks publishing. */
export function buildDeviceAiSuggestions(draft: SellListingDraft): DeviceAiSuggestion[] {
  const suggestions: DeviceAiSuggestion[] = [];

  if (draft.title.trim().length > 0 && draft.title.trim().length < 12) {
    suggestions.push({
      id: "title-short",
      label: "Title could be more descriptive",
      detail: "Add brand, size, or condition to help buyers find your item.",
      kind: "title",
    });
  }

  if (draft.description.trim().length > 0 && wordCount(draft.description) < 15) {
    suggestions.push({
      id: "description-short",
      label: "Add more detail to your description",
      detail: "Mention flaws, measurements, or what is included in the sale.",
      kind: "description",
    });
  }

  if (draft.photos.length === 1) {
    suggestions.push({
      id: "photo-single",
      label: "Add another photo angle",
      detail: "Listings with multiple photos tend to sell faster.",
      kind: "photo",
    });
  }

  const price = Number(draft.price);
  if (price > 0 && price < 1) {
    suggestions.push({
      id: "price-low",
      label: "Check your price",
      detail: "Very low prices can look like a mistake to buyers.",
      kind: "price",
    });
  }

  if (!draft.categoryPath && draft.title.trim().length >= 3) {
    suggestions.push({
      id: "category-missing",
      label: "Category not selected",
      detail: "Use AI Category or pick a category manually before publishing.",
      kind: "category",
    });
  }

  if (draft.title === draft.title.toUpperCase() && draft.title.trim().length > 4) {
    suggestions.push({
      id: "title-caps",
      label: "Avoid all-caps titles",
      detail: "Sentence case is easier to read in search results.",
      kind: "accessibility",
    });
  }

  return suggestions.slice(0, 4);
}
