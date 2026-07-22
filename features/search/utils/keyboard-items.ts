import type { SearchNavItem, SearchResults } from "@/features/search/types";

type BuildNavItemsParams = {
  results: SearchResults | null;
  history: string[];
  hasQuery: boolean;
  onSelectTerm: (term: string) => void;
  onSelectQuery: () => void;
  suggestionTerms?: string[];
};

const PRIMARY_PRODUCT_COUNT = 5;

export function buildSearchNavItems({
  results,
  history,
  hasQuery,
  onSelectTerm,
  onSelectQuery,
  suggestionTerms = [],
}: BuildNavItemsParams): SearchNavItem[] {
  if (!results) return [];

  const items: SearchNavItem[] = [];

  if (!hasQuery) {
    // Absolute Master Freeze idle: Recent + Trending ONLY
    history.forEach((term) => {
      items.push({
        id: `recent-search-${term}`,
        label: term,
        onSelect: () => onSelectTerm(term),
      });
    });

    results.trending.forEach((term) => {
      items.push({
        id: `trending-${term}`,
        label: term,
        onSelect: () => onSelectTerm(term),
      });
    });

    return items;
  }

  // Typing: Suggestions → Products → Categories → Stores → Members → Similar
  suggestionTerms.forEach((term) => {
    items.push({
      id: `suggestion-${term}`,
      label: term,
      onSelect: () => onSelectTerm(term),
    });
  });

  results.products.slice(0, PRIMARY_PRODUCT_COUNT).forEach((product) => {
    items.push({
      id: `product-${product.id}`,
      label: product.title,
      href: `/listing/${product.slug}`,
      onSelect: onSelectQuery,
    });
  });

  results.categories.forEach((category) => {
    items.push({
      id: `category-${category.href}`,
      label: category.name,
      href: category.href,
    });
  });

  results.stores.forEach((store) => {
    items.push({
      id: `store-${store.id}`,
      label: store.name,
      href: store.href,
    });
  });

  results.users.forEach((user) => {
    items.push({
      id: `user-${user.id}`,
      label: user.name,
      href: user.href,
    });
  });

  results.products.slice(PRIMARY_PRODUCT_COUNT).forEach((product) => {
    items.push({
      id: `similar-${product.id}`,
      label: product.title,
      href: `/listing/${product.slug}`,
      onSelect: onSelectQuery,
    });
  });

  return items;
}

export const SEARCH_PRIMARY_PRODUCT_COUNT = PRIMARY_PRODUCT_COUNT;
