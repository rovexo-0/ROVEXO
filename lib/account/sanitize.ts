export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

export function sanitizeOptionalText(input: string | undefined): string | undefined {
  if (input == null) return undefined;
  const cleaned = sanitizeText(input);
  return cleaned.length ? cleaned : undefined;
}
