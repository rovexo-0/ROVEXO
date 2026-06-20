export type {
  SearchCategory,
  SearchNavItem,
  SearchOverlayContextValue,
  SearchOverlayProps,
  SearchResults,
  SearchSeller,
  SearchStore,
  SearchUser,
} from "@/features/search/types";

export {
  SEARCH_DEBOUNCE_MS,
  SEARCH_PRODUCT_PAGE_SIZE,
  SEARCH_TRANSITION_MS,
} from "@/features/search/types";

export {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
} from "@/features/search/utils/history";

export {
  searchAll,
  hasSearchResults,
  mergeProductResults,
} from "@/features/search/utils/search";

export { fetchSearchResults } from "@/features/search/utils/fetch-search";
export { buildSearchNavItems } from "@/features/search/utils/keyboard-items";
