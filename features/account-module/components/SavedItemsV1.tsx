"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useState } from "react";
import { HeartLineIcon } from "@/components/icons/RvxLineIcons";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import type { SavedItem } from "@/lib/saved/types";
import { formatCurrency } from "@/lib/wallet/utils";

type SavedItemsV1Props = {
  initialItems: SavedItem[];
};

export function SavedItemsV1({ initialItems }: SavedItemsV1Props) {
  const [items, setItems] = useState(initialItems);

  const removeItem = async (slug: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const response = await fetch("/api/saved", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlugs: [slug] }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { items: SavedItem[] };
    setItems(payload.items);
  };

  return (
    <AccountModuleShell title="Saved Items" backHref="/account" version="v1.0">
      {items.length === 0 ? (
        <div className="acm-empty" data-saved-version="v1.0">
          <p className="acm-empty__title">No saved items</p>
          <p className="acm-empty__text">Tap the heart on any listing to save it here.</p>
          <Link href="/search" className="acm-cta__btn" style={{ marginTop: 16, display: "inline-flex" }}>
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="acm-saved-grid" data-saved-version="v1.0">
          {items.map((item) => (
            <Link key={item.productSlug} href={`/listing/${item.product.slug}`} className="acm-saved-card">
              <div className="acm-saved-card__image-wrap">
                <SafeImage
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover"
                />
                <button
                  type="button"
                  className="acm-saved-card__heart"
                  aria-label={`Remove ${item.product.title} from saved`}
                  onClick={(event) => void removeItem(item.productSlug, event)}
                >
                  <HeartLineIcon />
                </button>
              </div>
              <p className="acm-saved-card__title">{item.product.title}</p>
              <p className="acm-saved-card__price">{formatCurrency(item.product.price)}</p>
            </Link>
          ))}
        </div>
      )}
    </AccountModuleShell>
  );
}
