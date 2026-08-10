"use client";

import {
  CanonicalButtonLink,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalModal,
} from "@/src/components/canonical";
import { SafeImage } from "@/components/ui/SafeImage";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { PromotionPicker } from "@/features/seller/listings/components/PromotionPicker";
import type { SellerListingOverflowAction } from "@/features/seller/listings/components/SellerListingOverflowMenu";
import { cn } from "@/lib/cn";
import type { PromotionType } from "@/lib/promotions/config";
import type { ListingFilter, SellerListing } from "@/lib/listings/types";
import type { SellerListingsData } from "@/lib/seller/listings-queries";
import { editListingHref } from "@/lib/sell/canonical-edit-listing-engine-v1";
import { formatSellerStockLabel } from "@/lib/sell/inventory";
import type { ProductStatus } from "@/lib/supabase/types/database";
import { formatCurrency } from "@/lib/wallet/utils";
import "@/styles/rovexo/orders-page-v1.css";

const SellerListingOverflowMenu = dynamic(
  () =>
    import("@/features/seller/listings/components/SellerListingOverflowMenu").then(
      (m) => m.SellerListingOverflowMenu,
    ),
  { ssr: false },
);

const ShareListingSheet = dynamic(
  () =>
    import("@/components/share/ShareListingSheet").then((m) => m.ShareListingSheet),
  { ssr: false },
);

const LISTING_TABS: { id: Extract<ListingFilter, "published" | "sold">; label: string }[] = [
  { id: "published", label: "Active" },
  { id: "sold", label: "Sold" },
];

function listingStatusLabel(status: ProductStatus | string): string {
  if (status === "sold") return "Sold";
  if (status === "paused") return "Paused";
  return "Active";
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

type SellerListingsV1Props = {
  data: SellerListingsData;
};

export function SellerListingsV1({ data }: SellerListingsV1Props) {
  const router = useRouter();
  const { pushToast } = useToast();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const activeFilter: Extract<ListingFilter, "published" | "sold"> =
    filterParam === "sold" ? "sold" : "published";

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ProductStatus>>({});
  const [pendingDelete, setPendingDelete] = useState<SellerListing | null>(null);
  const [shareTarget, setShareTarget] = useState<SellerListing | null>(null);
  const [promotionTarget, setPromotionTarget] = useState<{
    listingId: string;
    title: string;
    type: PromotionType;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const listings = useMemo(
    () =>
      data.listings.map((listing) => {
        const override = statusOverrides[listing.id];
        return override ? { ...listing, status: override } : listing;
      }),
    [data.listings, statusOverrides],
  );

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  const closeDialog = () => {
    if (isDeleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/listings/${pendingDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to delete listing.");
      }
      setPendingDelete(null);
      setStatusOverrides((current) => {
        const next = { ...current };
        delete next[pendingDelete.id];
        return next;
      });
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete listing.");
    } finally {
      setIsDeleting(false);
    }
  };

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
          pushToast({
            title: payload.error ?? "Unable to start boost.",
            variant: "error",
          });
          return;
        }
        window.location.href = payload.url;
      } catch {
        pushToast({ title: "Unable to start boost.", variant: "error" });
      } finally {
        setBusyId(null);
        setPromotionTarget(null);
      }
    },
    [pushToast],
  );

  const runMenuAction = useCallback(
    async (action: SellerListingOverflowAction, listing: SellerListing) => {
      if (action === "edit") {
        setOpenMenuId(null);
        router.push(editListingHref(listing.id));
        return;
      }

      if (action === "view") {
        setOpenMenuId(null);
        router.push(`/listing/${listing.slug}`);
        return;
      }

      if (action === "share") {
        setOpenMenuId(null);
        setShareTarget(listing);
        return;
      }

      if (action === "boost") {
        if (listing.status !== "published") {
          pushToast({
            title: "Only active listings can be boosted.",
            variant: "error",
          });
          return;
        }
        if (listing.isBumped) {
          pushToast({
            title: listing.bumpRemainingLabel
              ? `Boost active — ${listing.bumpRemainingLabel} remaining.`
              : "This listing is already boosted.",
            variant: "info",
          });
          return;
        }
        setOpenMenuId(null);
        setPromotionTarget({ listingId: listing.id, title: listing.title, type: "bump" });
        return;
      }

      if (action === "pause") {
        setBusyId(listing.id);
        try {
          const response = await fetch(`/api/listings/${listing.id}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "pause" }),
          });
          if (!response.ok) {
            pushToast({ title: "Unable to pause listing.", variant: "error" });
            return;
          }
          setStatusOverrides((current) => ({ ...current, [listing.id]: "paused" }));
          setOpenMenuId(null);
        } catch {
          pushToast({ title: "Unable to pause listing.", variant: "error" });
        } finally {
          setBusyId(null);
        }
        return;
      }

      if (action === "resume") {
        setBusyId(listing.id);
        try {
          const response = await fetch(`/api/listings/${listing.id}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reactivate" }),
          });
          if (!response.ok) {
            pushToast({ title: "Unable to resume listing.", variant: "error" });
            return;
          }
          setStatusOverrides((current) => ({ ...current, [listing.id]: "published" }));
          setOpenMenuId(null);
        } catch {
          pushToast({ title: "Unable to resume listing.", variant: "error" });
        } finally {
          setBusyId(null);
        }
        return;
      }

      if (action === "duplicate") {
        setBusyId(listing.id);
        try {
          const response = await fetch(`/api/listings/${listing.id}/duplicate`, {
            method: "POST",
          });
          const payload = (await response.json().catch(() => null)) as
            | { listing?: { id?: string }; error?: string }
            | null;
          if (!response.ok || !payload?.listing?.id) {
            pushToast({
              title: payload?.error ?? "Unable to duplicate listing.",
              variant: "error",
            });
            return;
          }
          setOpenMenuId(null);
          router.push(editListingHref(payload.listing.id));
        } catch {
          pushToast({ title: "Unable to duplicate listing.", variant: "error" });
        } finally {
          setBusyId(null);
        }
        return;
      }

      if (action === "delete") {
        setOpenMenuId(null);
        setDeleteError(null);
        setPendingDelete(listing);
      }
    },
    [pushToast, router],
  );

  return (
    <AccountCanonicalShell title="My Listings" backHref="/account" showHeaderTitle>
      <AccountPageStack className="w-full max-w-none">
        <div
          className="orders-page w-full max-w-none"
          data-listings-version="v2.0-final"
          data-listings-full-width="v1"
        >
          <div className="orders-page__tabs w-full" role="tablist" aria-label="Listing filters">
            {LISTING_TABS.map((tab) => (
              <Link
                key={tab.id}
                href={tab.id === "published" ? "/seller/listings" : `/seller/listings?filter=${tab.id}`}
                role="tab"
                aria-selected={activeFilter === tab.id}
                className={cn("orders-page__tab", activeFilter === tab.id && "orders-page__tab--on")}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {listings.length === 0 ? (
            <CanonicalInfoBlock variant="description" className="w-full max-w-none">
              <p className="font-medium text-text-primary">No listings</p>
              <p className="mt-ds-1">Create your first listing to start selling.</p>
              <CanonicalButtonLink href="/sell" variant="secondary" fullWidth className="mt-ds-3">
                Create listing
              </CanonicalButtonLink>
            </CanonicalInfoBlock>
          ) : (
            <CanonicalCard variant="list" className="w-full max-w-none">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="ml-listings-row flex w-full max-w-none items-center gap-ds-3 py-ds-3"
                >
                  <Link
                    href={`/listing/${listing.slug}`}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <SafeImage src={listing.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={`/listing/${listing.slug}`} className="block min-w-0">
                      <p className="cds-menu-row__title truncate">{listing.title}</p>
                    </Link>
                    <p className="cds-menu-row__subtitle">
                      {formatCurrency(listing.price)} · {formatSellerStockLabel(listing.stock)} ·{" "}
                      {listingStatusLabel(listing.status)} · {listing.views} views
                    </p>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      data-listing-overflow-trigger={listing.id}
                      className="cds-menu-row__trailing inline-flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted"
                      aria-label={`Actions for ${listing.title}`}
                      aria-expanded={openMenuId === listing.id}
                      aria-haspopup="menu"
                      disabled={busyId === listing.id}
                      onClick={() =>
                        setOpenMenuId((current) => (current === listing.id ? null : listing.id))
                      }
                    >
                      <MoreIcon className="h-5 w-5" />
                    </button>

                    {openMenuId === listing.id ? (
                      <SellerListingOverflowMenu
                        listingId={listing.id}
                        listingTitle={listing.title}
                        status={listing.status}
                        busy={busyId === listing.id}
                        onClose={closeMenu}
                        onAction={(action) => void runMenuAction(action, listing)}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </CanonicalCard>
          )}
        </div>
      </AccountPageStack>

      <CanonicalModal
        open={pendingDelete !== null}
        variant="delete"
        title="Delete Listing"
        cancelLabel="Cancel"
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        loading={isDeleting}
        onClose={closeDialog}
        onConfirm={() => void confirmDelete()}
      >
        <p className="text-sm text-text-secondary">This action cannot be undone.</p>
        {deleteError ? (
          <p className="mt-ds-2 text-sm text-danger" role="alert">
            {deleteError}
          </p>
        ) : null}
      </CanonicalModal>

      <ShareListingSheet
        open={shareTarget !== null}
        onClose={() => setShareTarget(null)}
        title={shareTarget?.title ?? ""}
        slug={shareTarget?.slug ?? ""}
        productId={shareTarget?.id}
        price={shareTarget?.price}
        imageUrl={shareTarget?.imageUrl}
      />

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
    </AccountCanonicalShell>
  );
}
