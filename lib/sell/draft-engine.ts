import { createEmptyDraft, type SellListingDraft } from "@/features/sell/types";
import { loadDraftPhotos } from "@/lib/sell/draft-photo-storage";
import {
  clearSellDraft,
  loadSellDraft,
  loadUploadSessionId,
  saveUploadSessionId,
} from "@/lib/sell/draft-storage";
import { persistSellDraftSnapshot } from "@/lib/sell/persist-sell-draft";
import { inferUserModifiedFromDraft } from "@/lib/sell/suggestion-field-lock";

/** SELL-104 — autosave interval. */
export const DRAFT_AUTOSAVE_MS = 5000;

/** SELL-104 — draft TTL. */
export const DRAFT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

const DRAFT_SAVED_AT_KEY = "rovexo:sell-draft-saved-at";

export function touchDraftSavedAt(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_SAVED_AT_KEY, String(Date.now()));
}

export function loadDraftSavedAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DRAFT_SAVED_AT_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isDraftExpired(savedAt: number | null): boolean {
  if (!savedAt) return false;
  return Date.now() - savedAt > DRAFT_EXPIRY_MS;
}

export function isMeaningfulDraft(
  stored: Partial<SellListingDraft> | null,
  photoCount: number,
): boolean {
  if (photoCount > 0) return true;
  if (!stored) return false;
  return (
    (stored.title?.trim().length ?? 0) > 0 ||
    (stored.description?.trim().length ?? 0) > 0 ||
    stored.categoryPath !== null && stored.categoryPath !== undefined ||
    (stored.price?.trim().length ?? 0) > 0
  );
}

export async function detectRecoverableDraft(): Promise<boolean> {
  const savedAt = loadDraftSavedAt();
  if (isDraftExpired(savedAt)) {
    await discardLocalDraft();
    return false;
  }

  const stored = loadSellDraft();
  const photos = await loadDraftPhotos();
  return isMeaningfulDraft(stored, photos.length);
}

export async function loadLocalDraftForRestore(): Promise<{
  draft: SellListingDraft;
  uploadSessionId?: string;
}> {
  const stored = loadSellDraft();
  const photos = await loadDraftPhotos();
  const sessionId = loadUploadSessionId();

  const merged: SellListingDraft = {
    ...createEmptyDraft(),
    ...stored,
    parcelSize: stored?.parcelSize ?? null,
    photos: photos.length > 0 ? photos : [],
    userModified: inferUserModifiedFromDraft(stored ?? {}),
  };

  return { draft: merged, uploadSessionId: sessionId ?? undefined };
}

export async function discardLocalDraft(): Promise<void> {
  clearSellDraft();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(DRAFT_SAVED_AT_KEY);
  }
}

export async function persistDraftOnPublishFailure(refs: Parameters<typeof persistSellDraftSnapshot>[0]): Promise<void> {
  touchDraftSavedAt();
  await persistSellDraftSnapshot(refs);
}
