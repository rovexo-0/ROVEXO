export const LISTING_TITLE_MAX = 80;

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
  if (trimmed.length > 0 && trimmed.length < 3) {
    return "Title must be at least 3 characters.";
  }
  return undefined;
}
