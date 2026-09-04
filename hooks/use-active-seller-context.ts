"use client";

import { useCallback, useEffect, useState } from "react";
import {
  peekConfirmedSellerContext,
  SELLER_CONTEXT_CHANGED_EVENT,
} from "@/lib/business/switch-seller-context-client";
import {
  isSellerContext,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";

/**
 * Client mirror of seller_profiles.active_seller_context.
 * SSOT remains the DB + PATCH /api/business/context — this only reads it.
 */
export function useActiveSellerContext(initial?: SellerContext | null): SellerContext {
  const [context, setContext] = useState<SellerContext>(
    () => peekConfirmedSellerContext() ?? initial ?? "individual",
  );

  const refresh = useCallback(async () => {
    const hinted = peekConfirmedSellerContext();
    if (hinted) {
      setContext(hinted);
      return;
    }
    try {
      const response = await fetch("/api/business/status", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) return;
      const json = (await response.json()) as {
        status?: { activeSellerContext?: unknown };
      };
      const next = json.status?.activeSellerContext;
      if (isSellerContext(next)) setContext(next);
    } catch {
      /* Keep last known context. */
    }
  }, []);

  useEffect(() => {
    // Defer initial refresh — sync setState inside an effect body trips React 19 lint.
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    const onChanged = (event: Event) => {
      const next = (event as CustomEvent<{ activeSellerContext?: unknown }>).detail
        ?.activeSellerContext;
      if (isSellerContext(next)) setContext(next);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener(SELLER_CONTEXT_CHANGED_EVENT, onChanged);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(SELLER_CONTEXT_CHANGED_EVENT, onChanged);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh]);

  return context;
}
