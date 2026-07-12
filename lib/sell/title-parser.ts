import { MARKETPLACE_BRANDS } from "@/lib/sell/marketplace-knowledge-base";
import { TITLE_STOP_WORDS } from "@/lib/sell/marketplace-knowledge-base";
import { normalizeListingText } from "@/lib/sell/suggest-category-from-title";

export type ParsedTitle = {
  raw: string;
  tokens: string[];
  keywords: string[];
  brand: string | null;
  productHint: string | null;
};

function tokenizeTitle(title: string): string[] {
  return normalizeListingText(title)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function findBrandInTokens(tokens: string[]): string | null {
  const corpus = tokens.join(" ");
  for (const brand of MARKETPLACE_BRANDS) {
    const pattern = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(corpus)) return brand;
  }
  return null;
}

/** Deterministic title parser — no AI, no external APIs. */
export function parseListingTitle(title: string): ParsedTitle {
  const raw = title.trim();
  const tokens = tokenizeTitle(raw);
  const keywords = tokens.filter((token) => !TITLE_STOP_WORDS.has(token.toLowerCase()));
  const brand = findBrandInTokens(tokens);

  const productTokens = keywords.filter(
    (token) => !brand || token.toLowerCase() !== brand.toLowerCase(),
  );
  const productHint = productTokens.length > 0 ? productTokens.join(" ") : null;

  return {
    raw,
    tokens,
    keywords,
    brand,
    productHint,
  };
}
