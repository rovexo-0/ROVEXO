"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";

export function RecentlyViewedSection() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    void fetch("/api/recently-viewed")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { items?: Product[] } | null) => setItems(payload?.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="px-ds-4">
      <div className="mb-ds-3 flex items-end justify-between gap-ds-3">
        <h2 id="recently-viewed-heading" className="text-lg font-semibold text-text-primary">
          Recently viewed
        </h2>
        <Link href="/saved" className="text-sm font-semibold text-primary hover:opacity-80">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-ds-3 md:grid-cols-3 md:gap-ds-4 lg:grid-cols-4">
        {items.slice(0, 4).map((product) => (
          <div key={product.slug} className="h-full">
            <Link href={`/listing/${product.slug}`}>
              <ProductCard {...productToCardProps(product, "homepage")} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
