"use client";

import { useEffect } from "react";
import { useSearchOverlayOptional } from "@/features/search/client";

/** Opens search overlay; no marketing landing chrome. */
export function SearchLandingClient() {
  const searchOverlay = useSearchOverlayOptional();

  useEffect(() => {
    searchOverlay?.open();
  }, [searchOverlay]);

  return null;
}
