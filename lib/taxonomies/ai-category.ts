import { type FlatCategoryPath } from "@/lib/categories/types";
import { normalizeSearchTerm, tokenize } from "@/lib/taxonomy/category-normalizer";
import { searchCategories, type CategorySearchResult } from "@/lib/taxonomy/category-search";
import {
  getCategoryById,
  getCategoryBySlug,
  getCategoryPathSlugs,
} from "@/lib/taxonomy/category-index";
import { getSynonymMatches } from "@/lib/taxonomy/category-synonyms";
import type { TaxonomyCategoryNode } from "@/lib/taxonomy/category-tree";

export type AiCategorySuggestion = {
  path: FlatCategoryPath;
  category: TaxonomyCategoryNode;
  confidence: number;
  source: "title" | "description" | "photo" | "synonym" | "combined";
};

export type AiCategoryResult = {
  bestMatch: AiCategorySuggestion | null;
  topMatches: AiCategorySuggestion[];
  confidence: number;
  source: "taxonomy" | "legacy";
};

const CONFIDENCE_THRESHOLD = 0.7;
const MAX_RESULTS = 5;

function buildCategoryPath(category: TaxonomyCategoryNode): FlatCategoryPath | null {
  const slugs = getCategoryPathSlugs(category.id);
  const segments = slugs
    .map((slug) => getCategoryBySlug(slug))
    .filter((node): node is TaxonomyCategoryNode => Boolean(node));

  if (segments.length < 2) {
    return null;
  }

  const [categorySegment, subcategorySegment, childCategorySegment] = segments;

  return {
    categoryId: categorySegment.id,
    categoryName: categorySegment.name,
    categorySlug: categorySegment.slug,
    subcategoryId: subcategorySegment.id,
    subcategoryName: subcategorySegment.name,
    subcategorySlug: subcategorySegment.slug,
    childCategoryId: childCategorySegment?.id,
    childCategoryName: childCategorySegment?.name,
    childCategorySlug: childCategorySegment?.slug,
    segments: segments.map((segment) => ({
      id: segment.id,
      slug: segment.slug,
      name: segment.name,
    })),
    pathLabel: segments.map((segment) => segment.name).join(" › "),
  };
}

function formatSuggestion(result: CategorySearchResult): AiCategorySuggestion | null {
  const category = result.category;
  const path = buildCategoryPath(category);
  if (!path) return null;

  return {
    category,
    path,
    confidence: Math.min(1, result.score / 150),
    source: "combined",
  };
}

function normalizeForSearch(text: string): string {
  return normalizeSearchTerm(text).trim();
}

function computeCombinedText(title: string, description: string, labels: string[]): string {
  const pieces = [title.trim(), description.trim(), ...labels].filter(Boolean);
  return pieces.join(" ");
}

function buildPhotoLabels(photos: Array<{ description?: string; filename?: string }>): string[] {
  return photos
    .flatMap((photo) => [photo.description ?? "", photo.filename ?? ""])
    .filter(Boolean)
    .map((value) => normalizeSearchTerm(value));
}

export function detectAiCategory(
  title: string,
  description: string,
  photoMetadata: Array<{ description?: string; filename?: string }> = [],
): AiCategoryResult {
  const searchText = computeCombinedText(title, description, buildPhotoLabels(photoMetadata));
  const normalized = normalizeForSearch(searchText);

  if (!normalized) {
    return { bestMatch: null, topMatches: [], confidence: 0, source: "taxonomy" };
  }

  const results = searchCategories(normalized, { limit: MAX_RESULTS, includeNonLeaf: false });

  if (results.length === 0) {
    return { bestMatch: null, topMatches: [], confidence: 0, source: "taxonomy" };
  }

  const suggestions = results
    .map(formatSuggestion)
    .filter((suggestion): suggestion is AiCategorySuggestion => Boolean(suggestion));

  if (suggestions.length === 0) {
    return { bestMatch: null, topMatches: [], confidence: 0, source: "taxonomy" };
  }

  return {
    bestMatch: suggestions[0] ?? null,
    topMatches: suggestions.slice(0, MAX_RESULTS),
    confidence: suggestions[0]?.confidence ?? 0,
    source: "taxonomy",
  };
}

export function shouldAskUserForCategory(confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLD;
}
