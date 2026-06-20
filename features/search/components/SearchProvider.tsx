"use client";

import type { ReactNode } from "react";
import { SearchOverlay } from "@/features/search/components/SearchOverlay";
import { SearchOverlayContext } from "@/features/search/hooks/use-search-overlay";
import { useSearchOverlayState } from "@/features/search/hooks/use-search-overlay-state";

type SearchProviderProps = {
  children: ReactNode;
  isSeller?: boolean;
};

export function SearchProvider({ children, isSeller = false }: SearchProviderProps) {
  const { isOpen, initialQuery, open, close, value } = useSearchOverlayState(isSeller);

  return (
    <SearchOverlayContext.Provider value={value}>
      {children}
      {isOpen && (
        <SearchOverlay initialQuery={initialQuery} isSeller={isSeller} onClose={close} />
      )}
    </SearchOverlayContext.Provider>
  );
}
