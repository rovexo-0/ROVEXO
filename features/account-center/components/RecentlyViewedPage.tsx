"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { ListingCard } from "@/components/ui/ListingCard";
import type { Product } from "@/lib/products/types";

/**
 * Buying → Recently Viewed — Compact Premium 2-column grid (PO Two Column Policy).
 */
export function RecentlyViewedPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/recently-viewed", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed");
        const payload = (await response.json()) as { items?: Product[] };
        if (!cancelled) setItems(payload.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AccountCanonicalShell
      title="Recently Viewed"
      backHref="/account/buying"
      backLabel="Buying"
      showHeaderTitle
      intro="Items you browsed recently."
    >
      {loading ? (
        <p className="cds-section__intro">Loading…</p>
      ) : items.length === 0 ? (
        <div className="px-0 py-ds-4 text-center">
          <p className="text-sm font-semibold text-text-primary">No recently viewed items</p>
          <Link href="/search" className="mt-ds-4 inline-flex min-h-[44px] items-center font-semibold text-primary">
            Find something to buy
          </Link>
        </div>
      ) : (
        <div className="rx-listing-grid grid grid-cols-2 gap-3" data-listing-grid="2-col">
          {items.map((product) => (
            <ListingCard key={product.id} product={product} variant="grid" surface="recently-viewed" />
          ))}
        </div>
      )}
    </AccountCanonicalShell>
  );
}
