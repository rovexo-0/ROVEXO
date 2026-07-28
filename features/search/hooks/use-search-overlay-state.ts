"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SearchOverlayContextValue } from "@/features/search/types";
import { SEARCH_TRANSITION_MS } from "@/features/search/types";
import {
  setImageSearchResults,
  type CameraSearchResultsPayload,
} from "@/lib/image-search/results-store";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";

/**
 * ONE SearchProvider state owner — overlay, camera results, loading, navigation.
 * Master rule: router.replace ONLY when resultsReady && overlayClosed && navigationReady.
 */
export function useSearchOverlayState(isSeller: boolean): {
  isOpen: boolean;
  initialQuery: string;
  open: (query?: string) => void;
  close: () => void;
  reset: () => void;
  value: SearchOverlayContextValue;
} {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");
  const [loading, setLoadingState] = useState(false);
  const [results, setResultsState] = useState<CameraSearchResultsPayload | null>(null);
  const [resultsReady, setResultsReadyState] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);

  const overlayClosed = !isOpen;

  const open = useCallback((query = "") => {
    setInitialQuery(query);
    setIsOpen(true);
    setNavigationReady(false);
  }, []);

  /** Overlay only — does not clear resultsReady (camera handoff). */
  const close = useCallback(() => {
    setIsOpen(false);
    setInitialQuery("");
  }, []);

  const reset = useCallback(() => {
    setLoadingState(false);
    setResultsReadyState(false);
    setNavigationReady(false);
    setResultsState(null);
  }, []);

  // Soft-nav away (listing/store/etc.) must never leave overlay mounted over the page.
  // Adjust during render when pathname changes (React-supported) — no sync effect setState.
  const [overlayPath, setOverlayPath] = useState(pathname);
  if (pathname !== overlayPath) {
    setOverlayPath(pathname);
    setIsOpen(false);
    setInitialQuery("");
  }

  const setLoading = useCallback((value: boolean) => {
    setLoadingState(value);
  }, []);

  const setResults = useCallback((payload: CameraSearchResultsPayload) => {
    setImageSearchResults(payload);
    setResultsState(payload);
  }, []);

  const setResultsReady = useCallback((value: boolean) => {
    setResultsReadyState(value);
    if (!value) setNavigationReady(false);
  }, []);

  // Camera handoff: results ready → close overlay → navigation ready → replace.
  useEffect(() => {
    if (!resultsReady) return;
    // FAIL: results === NULL → STOP
    if (results == null) return;

    // Overlay still open → SearchProvider.close() only (never Header/Results/Router).
    if (!overlayClosed) {
      void Promise.resolve().then(() => {
        close();
      });
      return;
    }

    // Overlay closed → arm navigation after paint/transition.
    if (!navigationReady) {
      const timer = window.setTimeout(() => {
        setNavigationReady(true);
      }, SEARCH_TRANSITION_MS);
      return () => window.clearTimeout(timer);
    }

    // MASTER GATE — all three must pass.
    if (resultsReady === true && overlayClosed === true && navigationReady === true) {
      router.replace(CAMERA_SEARCH_V1.resultsRoute);
      void Promise.resolve().then(() => {
        setResultsReadyState(false);
        setNavigationReady(false);
        setLoadingState(false);
      });
    }
  }, [
    resultsReady,
    results,
    overlayClosed,
    navigationReady,
    close,
    router,
  ]);

  const value = useMemo<SearchOverlayContextValue>(
    () => ({
      open,
      close,
      reset,
      isOpen,
      isSeller,
      loading,
      setLoading,
      results,
      setResults,
      resultsReady,
      setResultsReady,
      overlayClosed,
      navigationReady,
    }),
    [
      open,
      close,
      reset,
      isOpen,
      isSeller,
      loading,
      setLoading,
      results,
      setResults,
      resultsReady,
      setResultsReady,
      overlayClosed,
      navigationReady,
    ],
  );

  return { isOpen, initialQuery, open, close, reset, value };
}
