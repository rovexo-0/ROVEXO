/**
 * Normalize user/search-param query text.
 * Rejects non-strings and JS sentinel strings that must never reach UI or recovery labels.
 */
export function isInvalidSearchSentinel(raw: unknown): boolean {
  if (typeof raw !== "string") return true;
  const lower = raw.trim().toLowerCase();
  return lower === "undefined" || lower === "null" || lower === "nan";
}

export function sanitizeSearchQuery(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (isInvalidSearchSentinel(trimmed)) return "";
  return trimmed;
}
