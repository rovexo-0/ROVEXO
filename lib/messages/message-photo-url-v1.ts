/**
 * ROVEXO Phase A2 — Messages photo URL contract.
 * Private `messages` bucket stores paths; Conversation renders signed/blob/https only.
 */

export const MESSAGE_PHOTO_SIGN_TTL_SECONDS = 60 * 60 * 24 * 7;

export const MESSAGE_PHOTO_PREVIEW_LABEL = "Shared photo";

/** Storage object path persisted in `messages.content` for kind=photo. */
export function isMessagePhotoStoragePath(content: string | null | undefined): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  if (/^(https?:|blob:|data:)/i.test(trimmed)) return false;
  if (trimmed === MESSAGE_PHOTO_PREVIEW_LABEL) return false;
  if (trimmed === "Message deleted") return false;
  // Canonical path: `{conversationId}/{uuid}.{ext}`
  return /^[0-9a-f-]{8,}\/[^/\s]+\.(jpe?g|png|webp)$/i.test(trimmed) || /^[^/\s]+\/[^/\s]+\.(jpe?g|png|webp)$/i.test(trimmed);
}

/** Safe to pass to SafeImage / <img> without signing. */
export function isRenderableMessagePhotoSrc(content: string | null | undefined): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  if (/^(blob:|data:)/i.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return false;
}

export function messagePhotoInboxPreview(kind: string, content: string): string {
  if (kind === "photo") return MESSAGE_PHOTO_PREVIEW_LABEL;
  return content;
}
