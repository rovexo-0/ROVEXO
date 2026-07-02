import { detectAiCategory } from "@/lib/taxonomies/ai-category";
import { matchCategoriesFromLabels } from "@/lib/ai-camera/rules";
import { toPathId } from "@/lib/categories/queries";
import type { FlatCategoryPath } from "@/lib/categories/types";
import {
  KNOWN_BRANDS,
  TITLE_CATEGORY_RULES,
  TITLE_SYNONYMS,
  resolveTitleCategoryPath,
} from "@/lib/sell/title-category-rules";

export type TitleCategorySuggestion = {
  path: FlatCategoryPath;
  confidence: number;
};

export const MIN_TITLE_LENGTH = 5;

function expandSynonyms(text: string): string {
  let expanded = text;
  for (const [abbrev, full] of Object.entries(TITLE_SYNONYMS)) {
    const pattern = new RegExp(`\\b${abbrev.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    expanded = expanded.replace(pattern, full);
  }
  return expanded;
}

export function normalizeListingText(title: string): string {
  return expandSynonyms(title.trim().toLowerCase()).replace(/\s+/g, " ");
}

function titleToLabels(title: string): string[] {
  const normalized = normalizeListingText(title);
  if (!normalized) return [];

  const tokens = normalized.split(/[\s,./\-–—|+()]+/).filter((token) => token.length >= 2);
  const brands = tokens.filter((token) => KNOWN_BRANDS.has(token));
  return [normalized, ...tokens, ...brands];
}

function patternMatchesTitle(pattern: string, title: string): boolean {
  const alternatives = pattern.split("|").map((part) => part.trim()).filter(Boolean);
  return alternatives.some((part) => title.includes(part));
}

function scoreTitleRule(title: string, rule: (typeof TITLE_CATEGORY_RULES)[number]): number | null {
  const allPatternsMatch = rule.patterns.every((pattern) => patternMatchesTitle(pattern, title));
  if (!allPatternsMatch) return null;

  let confidence = rule.confidence;
  if (rule.brands?.length) {
    const brandHit = rule.brands.some((brand) => title.includes(brand));
    if (brandHit) confidence = Math.min(confidence + 0.01, 0.99);
  }

  return confidence;
}

function matchTitleRules(title: string): TitleCategorySuggestion[] {
  const matches = new Map<string, TitleCategorySuggestion>();

  for (const rule of TITLE_CATEGORY_RULES) {
    const confidence = scoreTitleRule(title, rule);
    if (confidence == null) continue;

    const path = resolveTitleCategoryPath(rule.path);
    if (!path) continue;

    const pathId = toPathId(path);
    const existing = matches.get(pathId);
    if (!existing || confidence > existing.confidence) {
      matches.set(pathId, { path, confidence });
    }
  }

  return [...matches.values()].sort((a, b) => b.confidence - a.confidence);
}

export function suggestCategoryFromTitle(
  title: string,
  description = "",
  photoMetadata: Array<{ description?: string; filename?: string }> = [],
): TitleCategorySuggestion[] {
  const trimmed = title.trim();
  if (trimmed.length < MIN_TITLE_LENGTH) return [];

  const normalized = normalizeListingText(trimmed);
  const ruleMatches = matchTitleRules(normalized);
  if (ruleMatches.length > 0) {
    return ruleMatches.slice(0, 3);
  }

  const aiResult = detectAiCategory(trimmed, description, photoMetadata);
  if (aiResult.topMatches.length > 0) {
    return aiResult.topMatches.slice(0, 3).map((suggestion) => ({
      path: suggestion.path,
      confidence: suggestion.confidence,
    }));
  }

  return matchCategoriesFromLabels(titleToLabels(trimmed)).map(({ path, confidence }) => ({
    path,
    confidence,
  }));
}

/** Anonymous hash for learning logs — never store raw titles. */
export function hashTitleForLearning(title: string): string {
  const normalized = normalizeListingText(title);
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
