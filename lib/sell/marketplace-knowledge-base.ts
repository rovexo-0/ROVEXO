/**
 * Marketplace Knowledge Base — offline, version-controlled SSOT for the Smart Description Engine.
 * No AI. No network. Re-exports and normalises existing deterministic data.
 */

export const KNOWLEDGE_BASE_VERSION = "1.0.0";

export { MARKETPLACE_BRANDS, findBrandByName } from "@/lib/categories/enterprise/brands";
export { MARKETPLACE_COLOURS } from "@/lib/categories/enterprise/colours";
export {
  TITLE_CATEGORY_RULES,
  TITLE_SYNONYMS,
  KNOWN_BRANDS,
} from "@/lib/sell/title-category-rules";

/** Deterministic stop words removed during title parsing (SELL Smart Description §STEP 2). */
export const TITLE_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "for",
  "with",
  "and",
  "or",
  "in",
  "on",
  "at",
  "to",
  "of",
  "by",
  "from",
  "is",
  "it",
  "this",
  "that",
  "my",
  "your",
  "our",
  "their",
  "etc",
  "very",
  "used",
  "sale",
  "selling",
  "item",
  "listing",
]);

export type SupportedDescriptionLocale =
  | "en"
  | "ro"
  | "fr"
  | "de"
  | "es"
  | "it";

export const SUPPORTED_DESCRIPTION_LOCALES: SupportedDescriptionLocale[] = [
  "en",
  "ro",
  "fr",
  "de",
  "es",
  "it",
];
