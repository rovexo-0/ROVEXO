export const LISTING_TITLE_MIN = 5;
export const LISTING_TITLE_MAX = 100;

export function clampListingTitle(value: string): string {
  return value.slice(0, LISTING_TITLE_MAX);
}

export function validateListingTitle(
  title: string,
  options?: { required?: boolean },
): string | undefined {
  const trimmed = title.trim();
  if (!trimmed && options?.required) {
    return "Title is required.";
  }
  if (trimmed.length > 0 && trimmed.length < LISTING_TITLE_MIN) {
    return `Title must be at least ${LISTING_TITLE_MIN} characters.`;
  }
  if (trimmed.length > LISTING_TITLE_MAX) {
    return `Title must be at most ${LISTING_TITLE_MAX} characters.`;
  }
  return undefined;
}
