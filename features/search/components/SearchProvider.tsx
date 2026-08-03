"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { SearchOverlayContext } from "@/features/search/hooks/use-search-overlay";
import { useSearchOverlayState } from "@/features/search/hooks/use-search-overlay-state";

const SearchOverlay = dynamic(
  () =>
    import("@/features/search/components/SearchOverlay").then((m) => m.SearchOverlay),
  { ssr: false },
);

type SearchProviderProps = {
  children: ReactNode;
  isSeller?: boolean;
};

/**
 * ONE SearchProvider — sole owner of overlay, camera results, loading, navigation.
 * Forbidden: second providers, Header/Results/Auth calling closeOverlay.
 * RC6: SearchOverlay is dynamically imported so auth/login does not pay overlay chunk cost.
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
