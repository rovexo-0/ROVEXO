import type { Product } from "@/lib/products/types";

export type SearchCategory = {
  name: string;
  href: string;
};

export type SearchSeller = {
  name: string;
  href: string;
  avatar?: string | null;
};

export type SearchUser = {
  id: string;
  name: string;
  href: string;
  handle: string;
};

export type SearchStore = {
  id: string;
  name: string;
  href: string;
  description: string;
};

export type SearchResults = {
  products: Product[];
  sellers: SearchSeller[];
  stores: SearchStore[];
  users: SearchUser[];
  trending: string[];
  categories: SearchCategory[];
  productsHasMore: boolean;
  productsOffset: number;
};

export type SearchOverlayContextValue = {
  open: (query?: string) => void;
  close: () => void;
  isOpen: boolean;
  isSeller: boolean;
};

export type SearchNavItem = {
  id: string;
  label: string;
  href?: string;
  onSelect?: () => void;
};

export type SearchOverlayProps = {
  initialQuery?: string;
  isSeller?: boolean;
  onClose: () => void;
};

export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_PRODUCT_PAGE_SIZE = 8;
export const SEARCH_TRANSITION_MS = 150;
