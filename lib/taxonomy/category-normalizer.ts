const DIACRITIC_PATTERN = /[\u0300-\u036f]/g;
const INVALID_SEARCH_CHARS = /[^a-z0-9\s-]/g;
const WHITESPACE_PATTERN = /[\s-]+/g;

export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(DIACRITIC_PATTERN, "")
    .replace(/[“”„”«»]/g, "")
    .replace(/[‘’‚’]/g, "'")
    .replace(INVALID_SEARCH_CHARS, " ")
    .replace(WHITESPACE_PATTERN, " ")
    .trim();
}

export function slugify(value: string): string {
  return normalizeText(value.replace(/&/g, " and "))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return Array.from(new Set(normalized.split(WHITESPACE_PATTERN).filter(Boolean)));
}

export function normalizeSearchTerm(value: string): string {
  return tokenize(value).join(" ");
}

/**
 * Category-search stop-token threshold. The generated taxonomy contains
 * ubiquitous variant tokens (e.g. "max", "pro", "plus", "air") that appear in
 * thousands of nodes. Such tokens match nearly every category, so they provide
 * no discriminating signal for detection while dominating lookup cost. Tokens
 * whose inverted-index bucket exceeds this size are skipped at query time.
 */
export const MAX_TOKEN_DOCUMENT_FREQUENCY = 800;

export function normalizeKeyword(value: string): string {
  return normalizeText(value).replace(/\s+/g, " ");
}
