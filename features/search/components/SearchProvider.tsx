"use client";

import type { ReactNode } from "react";
import { SearchOverlay } from "@/features/search/components/SearchOverlay";
import { SearchOverlayContext } from "@/features/search/hooks/use-search-overlay";
import { useSearchOverlayState } from "@/features/search/hooks/use-search-overlay-state";

type SearchProviderProps = {
  children: ReactNode;
  isSeller?: boolean;
};

/**
 * ONE SearchProvider — sole owner of overlay, camera results, loading, navigation.
 * Forbidden: second providers, Header/Results/Auth calling closeOverlay.
 */
export function SearchProvider({ children, isSeller = false }: SearchProviderProps) {
  const { isOpen, initialQuery, close, reset, value } = useSearchOverlayState(isSeller);

  function handleOverlayDismiss() {
    reset();
    close();
  }

  return (
    <SearchOverlayContext.Provider value={value}>
      {children}
      {isOpen ? (
        <SearchOverlay
          initialQuery={initialQuery}
          isSeller={isSeller}
          onClose={handleOverlayDismiss}
        />
      ) : null}
    </SearchOverlayContext.Provider>
  );
}
