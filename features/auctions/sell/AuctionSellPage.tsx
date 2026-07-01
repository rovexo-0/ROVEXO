"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Button } from "@/components/ui/Button";
import { CategoryTreePicker } from "@/features/sell/components/CategoryTreePicker";
import { FieldError } from "@/features/sell/components/FieldError";
import { PhotoUploader } from "@/features/sell/components/PhotoUploader";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import { SellProvider, useSell } from "@/features/sell/context/SellProvider";
import { createEmptyDraft, SELL_CONDITIONS } from "@/features/sell/types";
import { AUCTION_DURATIONS } from "@/lib/auctions/constants";
import { auctionEndsAtFromDays } from "@/lib/auctions/utils";
import { uploadListingImage } from "@/lib/listings/upload-client";
import type { SellPhoto } from "@/features/sell/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const UK_SHIPPING = [
  { id: "collection_only" as const, label: "Collection Only" },
  { id: "delivery_available" as const, label: "UK Delivery" },
];

const fieldClassName =
  "min-h-ds-7 w-full rounded-ds-sm border border-border bg-surface px-ds-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring";

export function AuctionSellPage() {
  const initialDraft = useMemo(
    () => ({
      ...createEmptyDraft(),
      listingType: "auction" as const,
      shippingMethod: "delivery_available" as const,
    }),
    [],
  );

  return (
    <SellProvider initialDraft={initialDraft}>
      <AuctionSellPageContent />
    </SellProvider>
  );
}

function AuctionSellPageContent() {
  const router = useRouter();
  const { draft, updateDraft, setCategoryPath } = useSell();
  const [durationDays, setDurationDays] = useState("7");
  const [startingBid, setStartingBid] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const canPublish =
    draft.photos.length > 0 &&
    draft.title.trim().length >= 3 &&
    draft.description.trim().length >= 10 &&
    draft.categoryPath &&
    draft.condition &&
    Number(startingBid) >= 1 &&
    durationDays;

  const uploadPhotos = useCallback(async (photos: SellPhoto[]) => {
    const uploaded: SellPhoto[] = [];
    for (let index = 0; index < photos.length; index += 1) {
      const photo = photos[index]!;
      if (photo.uploaded && photo.url && photo.storagePath) {
        uploaded.push(photo);
        continue;
      }
      if (!photo.file) throw new Error("Add at least one photo.");
      const result = await uploadListingImage({ file: photo.file });
      uploaded.push({
        ...photo,
        uploaded: true,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        storagePath: result.storagePath,
        thumbnailStoragePath: result.thumbnailStoragePath,
        previewUrl: result.thumbnailUrl || result.url,
      });
    }
    return uploaded;
  }, []);

  const publishAuction = useCallback(async () => {
    setIsPublishing(true);
    setPublishError(null);

    try {
      const uploadedPhotos = await uploadPhotos(draft.photos);
      const start = Number(startingBid);
      const buyNow = buyNowPrice.trim() ? Number(buyNowPrice) : start;
      const days = Number(durationDays);

      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        condition: draft.condition,
        price: buyNow,
        acceptOffers: Boolean(buyNowPrice.trim() && Number(buyNowPrice) > start),
        deliveryCarriers:
          draft.shippingMethod === "collection_only" ? [] : ["Royal Mail", "Evri"],
        categoryPath: draft.categoryPath
          ? {
              categorySlug: draft.categoryPath.categorySlug,
              subcategorySlug: draft.categoryPath.subcategorySlug,
              childCategorySlug: draft.categoryPath.childCategorySlug,
              categorySlugs: draft.categoryPath.segments.map((segment) => segment.slug),
            }
          : null,
        inventory: { stock: 1 },
        listingType: "auction" as const,
        auctionStartPrice: start,
        reservePrice: reservePrice.trim() ? Number(reservePrice) : null,
        auctionEndsAt: auctionEndsAtFromDays(days),
        images: uploadedPhotos.map((photo, index) => ({
          url: photo.url!,
          thumbnailUrl: photo.thumbnailUrl ?? photo.url!,
          storagePath: photo.storagePath!,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      };

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Unable to start auction.");
      }

      const result = (await response.json()) as { listing?: { slug: string } };
      setPublishedSlug(result.listing?.slug ?? null);
      router.refresh();
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Unable to start auction.");
    } finally {
      setIsPublishing(false);
    }
  }, [buyNowPrice, draft, durationDays, reservePrice, router, startingBid, uploadPhotos]);

  if (publishedSlug) {
    return (
      <BetaAppShell showBottomNav={false}>
        <main className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col items-center justify-center px-ds-4 py-ds-6">
          <PublishedCheckmark />
          <h2 className="mt-ds-6 text-xl font-semibold text-text-primary">Your auction is live.</h2>
          <div className="mt-ds-8 flex w-full max-w-sm flex-col gap-ds-3">
            <Link href={`/listing/${publishedSlug}`} className="block w-full">
              <Button variant="primary" fullWidth size="lg">
                View Auction
              </Button>
            </Link>
            <Link href="/auctions" className="block w-full">
              <Button variant="secondary" fullWidth size="lg">
                Browse Auctions
              </Button>
            </Link>
          </div>
        </main>
      </BetaAppShell>
    );
  }

  return (
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <header>
          <h1 className="text-xl font-bold text-text-primary">Start Auction</h1>
          <p className="mt-1 text-sm text-text-secondary">
            List your item for live bidding across ROVEXO.
          </p>
        </header>

        {previewMode ? (
          <section className="auction-card-2026 p-ds-4">
            <h2 className="auction-card-2026__title">{draft.title || "Auction title"}</h2>
            <p className="mt-2 text-sm text-text-secondary">{draft.description || "Description preview"}</p>
            <p className="mt-ds-3 text-lg font-bold text-text-primary">Starting bid £{startingBid || "0"}</p>
            <p className="text-sm text-text-secondary">
              Duration: {durationDays} days · UK shipping only
            </p>
            <Button type="button" variant="outline" className="mt-ds-4" onClick={() => setPreviewMode(false)}>
              Back to edit
            </Button>
          </section>
        ) : (
          <>
            <PhotoUploader />

            <section className="rx-form-section overflow-hidden rounded-ds-xl">
              <div className="flex flex-col gap-ds-2 px-ds-4 py-ds-3">
                <input
                  id="auction-title"
                  className={cn(fieldClassName, focusRing)}
                  value={draft.title}
                  onChange={(event) => updateDraft({ title: event.target.value })}
                  placeholder="What are you auctioning?"
                  aria-label="Auction title"
                />
              </div>

              <div className="border-t border-border px-ds-4 py-ds-3">
                <CategoryTreePicker
                  value={draft.categoryPath?.pathLabel ?? null}
                  onChange={setCategoryPath}
                />
              </div>

              <div className="border-t border-border px-ds-4 py-ds-3">
                <textarea
                  id="auction-description"
                  rows={4}
                  className={cn(fieldClassName, "min-h-[6rem] resize-y", focusRing)}
                  value={draft.description}
                  onChange={(event) => updateDraft({ description: event.target.value })}
                  placeholder="Describe condition, inclusions, and shipping details"
                  aria-label="Auction description"
                />
              </div>

              <div className="border-t border-border px-ds-4 py-ds-3">
                <div className="flex flex-wrap gap-ds-2" role="group" aria-label="Condition">
                  {SELL_CONDITIONS.map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => updateDraft({ condition })}
                      className={cn(
                        "rounded-ds-full border px-ds-3 py-1.5 text-xs font-semibold",
                        draft.condition === condition
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-text-secondary",
                        focusRing,
                      )}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-ds-3 border-t border-border px-ds-4 py-ds-3 sm:grid-cols-2">
                <input
                  id="starting-bid"
                  type="number"
                  min={1}
                  step="0.01"
                  className={cn(fieldClassName, focusRing)}
                  value={startingBid}
                  onChange={(event) => setStartingBid(event.target.value)}
                  placeholder="Starting bid"
                  aria-label="Starting bid"
                />
                <input
                  id="reserve-price"
                  type="number"
                  min={1}
                  step="0.01"
                  className={cn(fieldClassName, focusRing)}
                  value={reservePrice}
                  onChange={(event) => setReservePrice(event.target.value)}
                  placeholder="Reserve price (optional)"
                  aria-label="Reserve price"
                />
                <input
                  id="buy-now"
                  type="number"
                  min={1}
                  step="0.01"
                  className={cn(fieldClassName, focusRing)}
                  value={buyNowPrice}
                  onChange={(event) => setBuyNowPrice(event.target.value)}
                  placeholder="Buy it now (optional)"
                  aria-label="Buy it now price"
                />
                <select
                  id="duration"
                  className={cn(fieldClassName, focusRing)}
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                  aria-label="Auction duration"
                >
                  {AUCTION_DURATIONS.map((option) => (
                    <option key={option.id} value={option.days}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-border px-ds-4 py-ds-3">
                <div className="grid gap-ds-2 sm:grid-cols-2" role="radiogroup" aria-label="Shipping">
                  {UK_SHIPPING.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateDraft({ shippingMethod: option.id })}
                      className={cn(
                        "rounded-ds-lg border px-ds-3 py-ds-3 text-left text-sm font-semibold",
                        draft.shippingMethod === option.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-text-secondary",
                        focusRing,
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        <FieldError message={publishError ?? undefined} />
      </main>

      <div className="rx-footer-bar fixed inset-x-0 bottom-0 z-[110]">
        <div className="mx-auto max-w-2xl px-ds-4 py-ds-3 pb-[max(env(safe-area-inset-bottom),var(--ds-space-3))]">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            className="min-h-ds-7 rounded-ds-lg text-base"
            disabled={!canPublish || isPublishing}
            onClick={previewMode ? () => void publishAuction() : () => setPreviewMode(true)}
          >
            {isPublishing ? "Publishing…" : previewMode ? "Start Auction" : "Preview Auction"}
          </Button>
        </div>
      </div>
    </BetaAppShell>
  );
}
