"use client";

import { createContext, useContext } from "react";
import type { SearchOverlayContextValue } from "@/features/search/types";

const SearchOverlayContext = createContext<SearchOverlayContextValue | null>(null);

export function useSearchOverlay() {
  const context = useContext(SearchOverlayContext);
  if (!context) {
    throw new Error("useSearchOverlay must be used within SearchProvider");
  }
  return context;
}

export function useSearchOverlayOptional() {
  return useContext(SearchOverlayContext);
}

export { SearchOverlayContext };
