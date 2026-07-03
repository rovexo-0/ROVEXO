import type { SellListingDraft } from "@/features/sell/types";
import { PARCEL_SIZES } from "@/features/sell/types";
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

/** A stored categoryPath is only usable if it still matches FlatCategoryPath. */
function isValidStoredCategoryPath(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "object") return false;
  const path = value as Record<string, unknown>;
  const segments = path.segments;
  return (
    Array.isArray(segments) &&
    segments.length >= 2 &&
    segments.every(
      (segment) =>
        !!segment &&
        typeof segment === "object" &&
        typeof (segment as Record<string, unknown>).slug === "string" &&
        typeof (segment as Record<string, unknown>).name === "string",
    ) &&
    typeof path.categorySlug === "string" &&
    typeof path.subcategorySlug === "string" &&
    typeof path.pathLabel === "string"
  );
}

/**
 * Legacy drafts (older app versions, most commonly still sitting in an iPhone's
 * localStorage) can hold structured values that no longer match the current
 * schema — e.g. a parcel size outside the allowed set or a category path shape
 * that predates `segments`. Restoring those leaves the Publish button
 * permanently disabled (or crashes the publish payload builder), which is the
 * mobile-only "cannot publish" divergence. Such drafts are discarded so the
 * form starts from a clean, valid state. Valid drafts are left untouched.
 */
function draftContainsInvalidValues(draft: Partial<SellListingDraft>): boolean {
  if (
    draft.parcelSize !== null &&
    draft.parcelSize !== undefined &&
    !(PARCEL_SIZES as readonly string[]).includes(draft.parcelSize)
  ) {
    return true;
  }
  if (!isValidStoredCategoryPath(draft.categoryPath)) return true;
  if (draft.title !== undefined && typeof draft.title !== "string") return true;
  if (draft.description !== undefined && typeof draft.description !== "string") return true;
  if (draft.price !== undefined && typeof draft.price !== "string") return true;
  return false;
}

export function loadSellDraft(): Partial<SellListingDraft> | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  let parsed: Partial<SellListingDraft> | null;
  try {
    parsed = JSON.parse(raw) as Partial<SellListingDraft>;
  } catch {
    clearSellDraft();
    return null;
  }

  if (!parsed || typeof parsed !== "object" || draftContainsInvalidValues(parsed)) {
    clearSellDraft();
    return null;
  }

  return parsed;
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
