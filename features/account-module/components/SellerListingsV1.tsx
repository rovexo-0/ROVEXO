"use client";

import {
  CanonicalButtonLink,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalModal,
} from "@/src/components/canonical";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { PromotionPicker } from "@/features/seller/listings/components/PromotionPicker";
import { cn } from "@/lib/cn";
import type { PromotionType } from "@/lib/promotions/config";
import type { ListingFilter, SellerListing } from "@/lib/listings/types";
import type { SellerListingsData } from "@/lib/seller/listings-queries";
import { formatCurrency } from "@/lib/wallet/utils";
import "@/styles/rovexo/orders-page-v1.css";

const LISTING_TABS: { id: Extract<ListingFilter, "published" | "sold">; label: string }[] = [
  { id: "published", label: "Active" },
  { id: "sold", label: "Sold" },
];

function listingStatusLabel(listing: SellerListing): string {
  return listing.status === "sold" ? "Sold" : "Active";
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
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const activeFilter: Extract<ListingFilter, "published" | "sold"> =
    filterParam === "sold" ? "sold" : "published";
  const listings = data.listings;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
  const [actionError, setActionError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handlePointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [openMenuId]);

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
      setActionError(null);
      try {
        const response = await fetch("/api/promotions/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: listingId, type, durationId, scheduledStartAt }),
        });
        const payload = (await response.json()) as { success?: boolean; url?: string; error?: string };
        if (!response.ok || !payload.success || !payload.url) {
          setActionError(payload.error ?? "Unable to start promotion.");
          return;
        }
        window.location.href = payload.url;
      } catch {
        setActionError("Unable to start promotion.");
      } finally {
        setBusyId(null);
        setPromotionTarget(null);
      }
    },
    [],
  );

  const runMenuAction = async (action: string, listing: SellerListing) => {
    setOpenMenuId(null);
    setActionError(null);

    if (action === "edit") {
      router.push(`/seller/listings/${listing.id}/edit`);
      return;
    }

    if (action === "share") {
      setShareTarget(listing);
      return;
    }

    if (action === "promote") {
      if (listing.status !== "published") {
        setActionError("Only active listings can be promoted.");
        return;
      }
      setPromotionTarget({ listingId: listing.id, title: listing.title, type: "bump" });
      return;
    }

    if (action === "sold") {
      setBusyId(listing.id);
      try {
        const response = await fetch(`/api/listings/${listing.id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sold" }),
        });
        if (!response.ok) {
          setActionError("Unable to mark listing as sold.");
          return;
        }
        router.refresh();
      } catch {
        setActionError("Unable to mark listing as sold.");
      } finally {
        setBusyId(null);
      }
      return;
    }

    if (action === "delete") {
      setDeleteError(null);
      setPendingDelete(listing);
    }
  };

  return (
    <AccountCanonicalShell title="My Listings" backHref="/account" showHeaderTitle>
      <AccountPageStack className="w-full">
        <div className="orders-page w-full" data-listings-version="v2.0-final">
          <div className="orders-page__tabs" role="tablist" aria-label="Listing filters">
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

          {actionError ? (
            <CanonicalInfoBlock variant="error">
              <p>{actionError}</p>
            </CanonicalInfoBlock>
          ) : null}

          {listings.length === 0 ? (
            <CanonicalInfoBlock variant="description">
              <p className="font-medium text-text-primary">No listings</p>
              <p className="mt-ds-1">Create your first listing to start selling.</p>
              <CanonicalButtonLink href="/sell" variant="secondary" className="mt-ds-3">
                Create listing
              </CanonicalButtonLink>
            </CanonicalInfoBlock>
          ) : (
            <CanonicalCard variant="list" className="w-full">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-ds-3 px-[var(--cds-row-padding-x)] py-ds-3"
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
                      {formatCurrency(listing.price)} · {listingStatusLabel(listing)} · {listing.views} views
                    </p>
                  </div>

                  <div
                    className="relative shrink-0"
                    ref={openMenuId === listing.id ? menuRef : undefined}
                  >
                    <button
                      type="button"
                      className="cds-menu-row__trailing inline-flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted"
                      aria-label={`Actions for ${listing.title}`}
                      aria-expanded={openMenuId === listing.id}
                      aria-haspopup="menu"
                      disabled={busyId === listing.id}
                      onClick={() => setOpenMenuId((current) => (current === listing.id ? null : listing.id))}
                    >
                      <MoreIcon className="h-5 w-5" />
                    </button>

                    {openMenuId === listing.id ? (
                      <div
                        className="absolute right-0 top-full z-20 mt-ds-1 min-w-[160px] overflow-hidden rounded-ds-lg border border-border bg-background shadow-ds-md"
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                          onClick={() => void runMenuAction("edit", listing)}
                        >
                          Edit
                        </button>
                        {listing.status === "published" ? (
                          <button
                            type="button"
                            role="menuitem"
                            className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                            onClick={() => void runMenuAction("sold", listing)}
                          >
                            Mark sold
                          </button>
                        ) : null}
                        <button
                          type="button"
                          role="menuitem"
                          className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                          onClick={() => void runMenuAction("delete", listing)}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                          onClick={() => void runMenuAction("promote", listing)}
                        >
                          Promote
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="block w-full px-ds-4 py-ds-3 text-left text-sm text-text-primary hover:bg-surface-muted"
                          onClick={() => void runMenuAction("share", listing)}
                        >
                          Share
                        </button>
                      </div>
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
        title="Delete listing?"
        cancelLabel="Cancel"
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        loading={isDeleting}
        onClose={closeDialog}
        onConfirm={() => void confirmDelete()}
      >
        <p className="text-sm text-text-secondary">This cannot be undone.</p>
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
          void startPromotionCheckout(promotionTarget.listingId, promotionTarget.type, durationId, scheduledStartAt);
        }}
      />
    </AccountCanonicalShell>
  );
}
