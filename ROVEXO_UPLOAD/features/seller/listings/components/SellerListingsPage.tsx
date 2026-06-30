"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { PromotionPicker } from "@/features/seller/listings/components/PromotionPicker";
import type { PromotionType } from "@/lib/promotions/config";
import type { ListingFilter, SellerListing } from "@/lib/listings/types";
import type { SellerListingsData } from "@/lib/seller/listings-queries";

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

const FILTERS: { id: ListingFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "paused", label: "Paused" },
  { id: "sold", label: "Sold" },
  { id: "out_of_stock", label: "Out of Stock" },
  { id: "low_stock", label: "Low Stock" },
];

const STATUS_LABELS: Record<SellerListing["status"], string> = {
  draft: "Draft",
  published: "Active",
  paused: "Paused",
  sold: "Sold",
  deleted: "Deleted",
};

const STATUS_VARIANTS: Record<
  SellerListing["status"],
  "default" | "success" | "warning" | "danger"
> = {
  draft: "default",
  published: "success",
  paused: "warning",
  sold: "default",
  deleted: "danger",
};

type ListingRowProps = {
  listing: SellerListing;
  onAction: (action: string, listingId: string) => Promise<void>;
  busy: boolean;
};

function ListingRow({
  listing,
  onAction,
  busy,
}: ListingRowProps) {
  const inventoryBadge = listing.isOutOfStock
    ? { label: "Out of Stock", variant: "danger" as const }
    : listing.isLowStock
      ? { label: "Low Stock", variant: "warning" as const }
      : null;

  return (
    <div className="flex min-h-[96px] flex-col gap-ds-2 px-ds-4 py-ds-3">
      <div className="flex items-center gap-ds-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
          <Image
            src={listing.thumbnailUrl ?? listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {listing.title}
          </p>

          <p className="text-xs text-text-secondary">
            £{listing.price.toFixed(2)}
            {listing.sku ? ` · SKU: ${listing.sku}` : ""}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={STATUS_VARIANTS[listing.status]}>
              {STATUS_LABELS[listing.status]}
            </Badge>

            {inventoryBadge && (
              <Badge variant={inventoryBadge.variant}>
                {inventoryBadge.label}
              </Badge>
            )}

            <Badge variant="default">
              Stock {listing.stock}
            </Badge>

            {listing.isBumped && listing.bumpRemainingLabel && (
              <Badge variant="success">
                🚀 Bump · {listing.bumpRemainingLabel}
              </Badge>
            )}

            {listing.isFeatured && listing.featureRemainingLabel && (
              <Badge variant="warning">
                ⭐ Featured · {listing.featureRemainingLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/seller/listings/${listing.id}/edit`}
          className={cn(
            "inline-flex min-h-ds-6 items-center rounded-ds-md border border-border px-ds-3 text-xs font-semibold text-text-primary",
            focusRing,
            transitionFast,
          )}
        >
          Edit
        </Link>

        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction("bump", listing.id)}
          className="rounded-ds-md bg-primary px-ds-3 py-2 text-xs font-semibold text-white"
        >
          🚀 Bump
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction("feature", listing.id)}
          className="rounded-ds-md bg-amber-500 px-ds-3 py-2 text-xs font-semibold text-white"
        >
          ⭐ Feature
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction("duplicate", listing.id)}
          className={cn(
            "inline-flex min-h-ds-6 items-center rounded-ds-md border border-border px-ds-3 text-xs font-semibold text-text-primary",
            focusRing,
          )}
        >
          Duplicate
        </button>

        {listing.status === "published" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAction("pause", listing.id)}
            className={cn(
              "inline-flex min-h-ds-6 items-center rounded-ds-md border border-border px-ds-3 text-xs font-semibold text-text-primary",
              focusRing,
            )}
          >
            Pause
          </button>
        )}

        {listing.status === "paused" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAction("reactivate", listing.id)}
            className={cn(
              "inline-flex min-h-ds-6 items-center rounded-ds-md border border-border px-ds-3 text-xs font-semibold text-text-primary",
              focusRing,
            )}
          >
            Reactivate
          </button>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction("delete", listing.id)}
          className="rounded-ds-md border border-red-500 px-ds-3 py-2 text-xs font-semibold text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function SellerListingsPage({ data }: { data: SellerListingsData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [promotionTarget, setPromotionTarget] = useState<{
    listingId: string;
    title: string;
    type: PromotionType;
  } | null>(null);

  const promotionStatus = searchParams.get("promotion");
  const promotionType = searchParams.get("type");
  const promotionMessage =
    promotionStatus === "success"
      ? promotionType === "feature"
        ? "Listing featured successfully."
        : "Listing bumped successfully."
      : promotionStatus === "cancelled"
        ? "Promotion checkout cancelled."
        : null;

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (promotionStatus === "success") {
      if (sessionId) {
        void fetch(`/api/promotions/confirm?session_id=${encodeURIComponent(sessionId)}`);
      }

      startTransition(() => {
        router.replace("/seller/listings");
        router.refresh();
      });
    } else if (promotionStatus === "cancelled") {
      const promotionId = searchParams.get("promotion_id");
      if (promotionId) {
        void fetch("/api/promotions/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promotionId }),
        });
      }
      router.replace("/seller/listings");
    }
  }, [promotionStatus, router, searchParams]);

  const startPromotionCheckout = useCallback(
    async (listingId: string, type: PromotionType, durationId: string, scheduledStartAt?: string | null) => {
      setBusyId(listingId);

      try {
        const response = await fetch("/api/promotions/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: listingId, type, durationId, scheduledStartAt }),
        });
        const payload = (await response.json()) as { success?: boolean; url?: string; error?: string };

        if (!response.ok || !payload.success || !payload.url) {
          setCheckoutError(payload.error ?? "Unable to start promotion checkout.");
          return;
        }

        window.location.href = payload.url;
      } catch {
        setCheckoutError("Unable to start promotion checkout.");
      } finally {
        setBusyId(null);
        setPromotionTarget(null);
      }
    },
    [],
  );

  const handleAction = useCallback(
    async (action: string, listingId: string) => {
      if (action === "delete") {
        const confirmed = window.confirm("Delete this listing? This cannot be undone.");
        if (!confirmed) return;
      }

      if (action === "bump" || action === "feature") {
        const listing = data.listings.find((item) => item.id === listingId);
        if (!listing) return;

        if (listing.status !== "published") {
          setCheckoutError("Only published listings can be promoted.");
          return;
        }

        setPromotionTarget({
          listingId,
          title: listing.title,
          type: action,
        });
        return;
      }

      setBusyId(listingId);

      try {
        if (action === "delete") {
          await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
        } else if (action === "duplicate") {
          await fetch(`/api/listings/${listingId}/duplicate`, { method: "POST" });
        } else if (action === "pause" || action === "reactivate") {
          await fetch(`/api/listings/${listingId}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });
        }

        startTransition(() => {
          router.refresh();
        });
      } finally {
        setBusyId(null);
      }
    },
    [data.listings, router],
  );

  return (
    <BetaAppShell showBottomNav={false}>
      <header className="rx-page-header sticky top-0 z-50">
        <div
          className={cn(
            "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
            "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
          )}
        >
          <Link
            href="/seller/dashboard"
            aria-label="Back to Seller Dashboard"
            className={cn(
              "inline-flex min-h-ds-7 min-w-ds-7 items-center justify-center justify-self-start rounded-ds-md text-text-primary",
              focusRing,
            )}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>

          <h1 className="truncate text-center text-lg font-semibold text-text-primary">My Listings</h1>

          <Link
            href="/sell"
            aria-label="Create new listing"
            className={cn(
              "inline-flex min-h-ds-7 min-w-ds-7 items-center justify-center justify-self-end rounded-ds-md text-lg text-primary",
              focusRing,
            )}
          >
            +
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-3 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {(promotionMessage || checkoutError) && (
          <Card padding="sm" className="border-primary/30 bg-primary/5">
            <p className="text-sm font-medium text-primary">{promotionMessage ?? checkoutError}</p>
          </Card>
        )}

        {data.lowStockCount > 0 && (
          <Card padding="sm" className="border-warning/30 bg-warning/5">
            <p className="text-sm font-medium text-warning">
              {data.lowStockCount} listing{data.lowStockCount === 1 ? "" : "s"} running low on stock.
            </p>
          </Card>
        )}

        <div className="flex gap-ds-2 overflow-x-auto overscroll-x-contain pb-ds-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((filter) => {
            const href =
              filter.id === "all" ? "/seller/listings" : `/seller/listings?filter=${filter.id}`;
            const isActive =
              filter.id === "all"
                ? !searchParams.get("filter")
                : searchParams.get("filter") === filter.id;

            return (
              <Link
                key={filter.id}
                href={href}
                className={cn(
                  "inline-flex min-h-ds-6 shrink-0 items-center rounded-ds-full border px-ds-3 text-xs font-semibold",
                  transitionFast,
                  focusRing,
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-text-secondary",
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        <Card padding="none" className="overflow-hidden">
          {data.listings.length === 0 ? (
            <p className="px-ds-4 py-ds-6 text-center text-sm text-text-secondary">
              No listings match this filter.
            </p>
          ) : (
            data.listings.map((listing, index) => (
              <div key={listing.id} className={index > 0 ? "border-t border-border" : undefined}>
                <ListingRow
                  listing={listing}
                  onAction={handleAction}
                  busy={isPending || busyId === listing.id}
                />
              </div>
            ))
          )}
        </Card>
      </main>

      <PromotionPicker
        open={promotionTarget !== null}
        type={promotionTarget?.type ?? "bump"}
        listingTitle={promotionTarget?.title ?? ""}
        busy={busyId !== null}
        onCancel={() => setPromotionTarget(null)}
        onSelect={(durationId, scheduledStartAt) => {
          if (!promotionTarget) return;
          void startPromotionCheckout(
            promotionTarget.listingId,
            promotionTarget.type,
            durationId,
            scheduledStartAt,
          );
        }}
      />
    </BetaAppShell>
  );
}