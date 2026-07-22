import type { Product } from "@/lib/products/types";

export type SearchCategory = {
  name: string;
  href: string;
};

export type SearchBrand = {
  name: string;
  href: string;
};

export type SearchLocation = {
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
  /** Live popular terms from listings DB — never AI-generated. */
  popular: string[];
  categories: SearchCategory[];
  brands: SearchBrand[];
  locations: SearchLocation[];
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
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_PRODUCT_PAGE_SIZE = 8;
export const SEARCH_TRANSITION_MS = 200;

export type SearchFilterScope = "products" | "auctions" | "businesses" | "sellers";

export const SEARCH_FILTER_SCOPES: { id: SearchFilterScope; label: string }[] = [
  { id: "products", label: "Products" },
  { id: "businesses", label: "Businesses" },
  { id: "sellers", label: "Sellers" },
];
