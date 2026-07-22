import type { SearchNavItem, SearchResults } from "@/features/search/types";

type BuildNavItemsParams = {
  results: SearchResults | null;
  history: string[];
  hasQuery: boolean;
  onSelectTerm: (term: string) => void;
  onSelectQuery: () => void;
};

export function buildSearchNavItems({
  results,
  history,
  hasQuery,
  onSelectTerm,
  onSelectQuery,
}: BuildNavItemsParams): SearchNavItem[] {
  if (!results) return [];

  const items: SearchNavItem[] = [];

  if (!hasQuery) {
    // Idle order must mirror Search Overlay render order (Search System v1.0):
    // Recent Searches → Trending → Popular → Categories → Stores → Brands
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

    results.popular.forEach((term) => {
      items.push({
        id: `popular-${term}`,
        label: term,
        onSelect: () => onSelectTerm(term),
      });
    });

    results.categories.forEach((category) => {
      items.push({
        id: `suggested-category-${category.href}`,
        label: category.name,
        href: category.href,
      });
    });

    results.stores.forEach((store) => {
      items.push({
        id: `suggested-store-${store.id}`,
        label: store.name,
        href: store.href,
      });
    });

    results.brands.forEach((brand) => {
      items.push({
        id: `suggested-brand-${brand.href}`,
        label: brand.name,
        href: brand.href,
      });
    });

    return items;
  }

  results.products.forEach((product) => {
    items.push({
      id: `product-${product.id}`,
      label: product.title,
      href: `/listing/${product.slug}`,
      onSelect: onSelectQuery,
    });
  });

  results.sellers.forEach((seller) => {
    items.push({
      id: `seller-${seller.href}`,
      label: seller.name,
      href: seller.href,
    });
  });

  results.users.forEach((user) => {
    items.push({
      id: `user-${user.id}`,
      label: user.name,
      href: user.href,
    });
  });

  results.stores.forEach((store) => {
    items.push({
      id: `store-${store.id}`,
      label: store.name,
      href: store.href,
    });
  });

  results.categories.forEach((category) => {
    items.push({
      id: `category-${category.href}`,
      label: category.name,
      href: category.href,
    });
  });

  results.brands.forEach((brand) => {
    items.push({
      id: `brand-${brand.href}`,
      label: brand.name,
      href: brand.href,
    });
  });

  results.locations.forEach((location) => {
    items.push({
      id: `location-${location.href}`,
      label: location.name,
      href: location.href,
    });
  });

  return items;
}
