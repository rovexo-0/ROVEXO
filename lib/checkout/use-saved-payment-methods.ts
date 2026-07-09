"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedPaymentMethod } from "@/lib/payments/repository";

async function fetchSavedPaymentMethods(): Promise<{
  methods: SavedPaymentMethod[];
  error: string | null;
}> {
  try {
    const response = await fetch("/api/payment-methods");
    const payload = (await response.json()) as {
      methods?: SavedPaymentMethod[];
      error?: string;
    };
    if (!response.ok) {
      return {
        methods: [],
        error: payload.error ?? `Unable to load saved cards (HTTP ${response.status}).`,
      };
    }
    return { methods: payload.methods ?? [], error: null };
  } catch {
    return { methods: [], error: "Unable to load saved cards." };
  }
}

export function useSavedPaymentMethods() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchSavedPaymentMethods().then((result) => {
      if (cancelled) return;
      setMethods(result.methods);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);

    void fetchSavedPaymentMethods().then((result) => {
      setMethods(result.methods);
      setError(result.error);
      setLoading(false);
    });
  }, []);

  const defaultMethod = methods.find((method) => method.isDefault) ?? methods[0] ?? null;

  return { methods, defaultMethod, loading, error, reload };
}
