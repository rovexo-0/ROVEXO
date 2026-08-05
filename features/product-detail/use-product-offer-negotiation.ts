"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  resolveProductOfferActionView,
  type OfferActionOfferInput,
  type ProductOfferActionView,
} from "@/lib/transaction-hub/dynamic-offer-action-engine-v1";

type ApiOfferRow = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  fromRole?: "buyer" | "seller";
  parentOfferId?: string | null;
};

function mapRows(rows: ApiOfferRow[]): OfferActionOfferInput[] {
  return rows.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.createdAt,
    fromRole: row.fromRole === "seller" ? "seller" : "buyer",
    parentOfferId: row.parentOfferId ?? null,
  }));
}

/**
 * Product-page offer negotiation — reads/patches existing /api/offers only.
 * P6: stable action callbacks so Listing action bar memo can skip unrelated updates.
 */
export function useProductOfferNegotiation(input: {
  productSlug: string;
  outOfStock: boolean;
  enabled: boolean;
}) {
  const [offers, setOffers] = useState<OfferActionOfferInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<"accept" | "decline" | "cancel" | "counter" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!input.enabled || input.outOfStock) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `/api/offers?productSlug=${encodeURIComponent(input.productSlug)}`,
          );
          if (cancelled) return;
          if (response.status === 401 || !response.ok) {
            setOffers([]);
            return;
          }
          const payload = (await response.json()) as { offers?: ApiOfferRow[] };
          if (!cancelled) setOffers(mapRows(payload.offers ?? []));
        } catch {
          if (!cancelled) setOffers([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input.enabled, input.outOfStock, input.productSlug, revision]);

  const view: ProductOfferActionView = useMemo(
    () =>
      resolveProductOfferActionView({
        outOfStock: input.outOfStock,
        offers: input.enabled ? offers : [],
      }),
    [input.enabled, input.outOfStock, offers],
  );
  const clearError = useCallback(() => setError(null), []);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);

  const patchOffer = useCallback(
    async (
      offerId: string,
      action: "accept" | "decline" | "counter",
      amount?: number,
    ): Promise<boolean> => {
      setBusy(
        action === "accept"
          ? "accept"
          : action === "counter"
            ? "counter"
            : action === "decline"
              ? "decline"
              : "cancel",
      );
      setError(null);
      try {
        const response = await fetch(`/api/offers/${offerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            amount,
            expectedStatus: "pending",
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { success?: boolean; error?: string }
          | null;
        if (!response.ok || payload?.success === false) {
          setError(payload?.error ?? "Unable to update offer.");
          return false;
        }
        setRevision((n) => n + 1);
        return true;
      } catch {
        setError("Unable to update offer.");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const accept = useCallback(
    (offerId: string) => patchOffer(offerId, "accept"),
    [patchOffer],
  );
  const decline = useCallback(
    (offerId: string) => patchOffer(offerId, "decline"),
    [patchOffer],
  );
  const cancel = useCallback(
    (offerId: string) => patchOffer(offerId, "decline"),
    [patchOffer],
  );
  const counter = useCallback(
    (offerId: string, amount: number) => patchOffer(offerId, "counter", amount),
    [patchOffer],
  );

  return useMemo(
    () => ({
      view,
      loading,
      busy,
      error,
      clearError,
      refresh,
      accept,
      decline,
      cancel,
      counter,
    }),
    [view, loading, busy, error, clearError, refresh, accept, decline, cancel, counter],
  );
}
