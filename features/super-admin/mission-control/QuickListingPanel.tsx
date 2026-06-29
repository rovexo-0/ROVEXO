"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export type QuickListingRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  createdAt: string;
};

type QuickListingPanelProps = {
  initialListings: QuickListingRow[];
};

export function QuickListingPanel({ initialListings }: QuickListingPanelProps) {
  const [listings, setListings] = useState(initialListings);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("9.99");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (productId: string, action: "publish" | "unpublish" | "archive" | "feature") => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/quick-listing", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, action }),
        });
        const data = (await response.json()) as { ok: boolean; listing?: QuickListingRow; error?: string };
        if (!response.ok || !data.listing) {
          setMessage(data.error ?? "Action failed.");
          return;
        }
        setListings((current) => current.map((item) => (item.id === productId ? { ...item, ...data.listing! } : item)));
        setMessage(`Listing ${action} complete.`);
      });
    },
    [],
  );

  const createListing = useCallback(() => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/super-admin/quick-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, price: Number(price), description }),
      });
      const data = (await response.json()) as { ok: boolean; listing?: QuickListingRow; error?: string };
      if (!response.ok || !data.listing) {
        setMessage(data.error ?? "Unable to create listing.");
        return;
      }
      setListings((current) => [data.listing!, ...current]);
      setTitle("");
      setDescription("");
      setMessage("Quick listing created.");
    });
  }, [description, price, title]);

  return (
    <div className="mc-quick-listing">
      <section className="mc-section rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Create listing</h2>
        <p className="mc-section__desc">Publish listings without switching to a seller account.</p>
        <div className="mc-quick-listing__form">
          <label className="mc-manager__field">
            <span>Title</span>
            <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} className="mc-manager__input" />
          </label>
          <label className="mc-manager__field">
            <span>Price (£)</span>
            <input type="number" min={0} step={0.01} value={price} onChange={(event) => setPrice(event.target.value)} className="mc-manager__input" />
          </label>
          <label className="mc-manager__field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mc-manager__textarea"
              rows={3}
            />
          </label>
          <Button disabled={isPending || !title.trim()} onClick={createListing}>
            Create & publish
          </Button>
        </div>
        {message ? <p className="mc-manager__message">{message}</p> : null}
      </section>

      <section className="mc-section">
        <h2 className="mc-section__title">Recent admin listings</h2>
        <div className="mc-quick-listing__list">
          {listings.map((listing) => (
            <div key={listing.id} className="mc-quick-listing__row rx-surface-card rounded-ds-xl p-ds-4">
              <div>
                <p className="font-semibold">{listing.title}</p>
                <p className="text-sm text-text-secondary">
                  {listing.status} · £{listing.price.toFixed(2)}
                </p>
              </div>
              <div className="mc-quick-listing__actions">
                <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction(listing.id, "publish")}>
                  Publish
                </Button>
                <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction(listing.id, "unpublish")}>
                  Unpublish
                </Button>
                <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction(listing.id, "feature")}>
                  Feature
                </Button>
                <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction(listing.id, "archive")}>
                  Archive
                </Button>
                <Link href={`/listing/${listing.slug}`} className={cn("mc-section__link", focusRing)}>
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
