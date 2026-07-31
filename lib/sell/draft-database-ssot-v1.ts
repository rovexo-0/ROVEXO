/**
 * ROVEXO Sell Draft Database SSOT v1.0
 *
 * ONE truth: products.status = 'draft'
 * Profile Drafts + Sell autosave + publish-failure persist read/write the same source.
 * Local storage is recovery cache only — never claim "draft saved" unless DB succeeded.
 */

export const DRAFT_DATABASE_SSOT_V1 = {
  version: "1.0" as const,
  status: "draft" as const,
  apiPath: "/api/sell/draft",
  storageKey: "rovexo:sell-database-draft-id",
} as const;

/** Shown only after products.status='draft' row exists / was updated. */
export const DRAFT_DATABASE_SAVED_MESSAGE =
  "Publishing failed. Your draft has been safely saved.";

/** Fail-closed fallback — never imply a Profile Draft exists. */
export const PUBLISH_FAILURE_NO_DRAFT_MESSAGE =
  "Publishing failed. Please try again.";

export type DatabaseDraftPersistResult =
  | { ok: true; draftId: string }
  | { ok: false; error: string };

export function isUploadedSellPhoto(photo: {
  url?: string;
  storagePath?: string;
  uploaded?: boolean;
}): boolean {
  return Boolean(
    photo.uploaded &&
      typeof photo.url === "string" &&
      photo.url.trim() &&
      typeof photo.storagePath === "string" &&
      photo.storagePath.trim(),
  );
}

/**
 * Fail closed: DB draft requires ≥1 uploaded photo so Profile Drafts can show a real card.
 * Title/description may still be incomplete (server pads safely).
 */
export function canPersistDatabaseDraft(input: {
  photos: Array<{ url?: string; storagePath?: string; uploaded?: boolean }>;
}): boolean {
  return input.photos.some(isUploadedSellPhoto);
}
