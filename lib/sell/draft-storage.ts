import type { SellListingDraft } from "@/features/sell/types";
import { clearDraftPhotos } from "@/lib/sell/draft-photo-storage";

const STORAGE_KEY = "rovexo:sell-draft";
const SESSION_KEY = "rovexo:sell-upload-session";

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

export function saveUploadSessionId(sessionId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, sessionId);
}

export function loadUploadSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function clearSellDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  void clearDraftPhotos();
}
