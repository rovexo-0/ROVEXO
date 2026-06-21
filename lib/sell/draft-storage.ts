import type { SellListingDraft } from "@/features/sell/types";

const STORAGE_KEY = "rovexo:sell-draft";

export function saveSellDraft(draft: SellListingDraft): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(draft, (key, value) =>
      key === "photos" || key === "analysis" ? undefined : value,
    ),
  );
}

export function loadSellDraft(): Partial<SellListingDraft> | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Partial<SellListingDraft>;
  } catch {
    return null;
  }
}

export function clearSellDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
