"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShareListingSheet } from "@/components/share/ShareListingSheet";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import { PromotionPicker } from "@/features/seller/listings/components/PromotionPicker";
import type { PromotionType } from "@/lib/promotions/config";
import type { ListingFilter, SellerListing } from "@/lib/listings/types";
import type { SellerListingsData } from "@/lib/seller/listings-queries";
import { formatCurrency } from "@/lib/wallet/utils";

const LISTING_TABS: { id: Extract<ListingFilter, "published" | "sold">; label: string }[] = [
  { id: "published", label: "Active" },
  { id: "sold", label: "Sold" },
];

function listingStatusLabel(listing: SellerListing): "Active" | "Sold" {
  return listing.status === "sold" ? "Sold" : "Active";
}

function listingStatusClass(listing: SellerListing): string {
  return listing.status === "sold" ? "acm-badge acm-badge--sold" : "acm-badge acm-badge--active";
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
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
    <AccountModuleShell title="My Listings" backHref="/account" version="v1.0">
      <div className="acm-tabs" role="tablist" aria-label="Listing filters" data-listings-version="v2.0-final">
        {LISTING_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "published" ? "/seller/listings" : `/seller/listings?filter=${tab.id}`}
            role="tab"
            aria-selected={activeFilter === tab.id}
            className={activeFilter === tab.id ? "acm-tabs__tab acm-tabs__tab--active" : "acm-tabs__tab"}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {actionError ? (
        <p className="acm-inline-notice" role="alert">
          {actionError}
        </p>
      ) : null}

      {listings.length === 0 ? (
        <div className="acm-empty">
          <p className="acm-empty__title">No listings yet</p>
          <p className="acm-empty__text">Start selling by creating your first listing.</p>
          <Link href="/sell" className="acm-cta__btn" style={{ marginTop: 16, display: "inline-flex" }}>
            Create listing
          </Link>
        </div>
      ) : (
        <ul className="acm-list">
          {listings.map((listing) => (
            <li key={listing.id} className="acm-list__item">
              <div className="acm-list__row">
                <div className="acm-listing">
                  <Link href={`/listing/${listing.slug}`} className="acm-listing__thumb" tabIndex={-1} aria-hidden>
                    <SafeImage src={listing.imageUrl} alt="" fill sizes="72px" className="object-cover" />
                  </Link>
                  <div className="acm-listing__body">
                    <Link href={`/listing/${listing.slug}`} className="acm-listing__title-link">
                      <p className="acm-listing__title">{listing.title}</p>
                    </Link>
                    <p className="acm-listing__price">{formatCurrency(listing.price)}</p>
                    <div className="acm-listing__meta">
                      <span className={listingStatusClass(listing)}>{listingStatusLabel(listing)}</span>
                      <span className="acm-listing__stats">
                        <span>{listing.views} views</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="acm-listing-menu" ref={openMenuId === listing.id ? menuRef : undefined}>
                  <button
                    type="button"
                    className="acm-listing-menu__trigger"
                    aria-label={`Actions for ${listing.title}`}
                    aria-expanded={openMenuId === listing.id}
                    aria-haspopup="menu"
                    disabled={busyId === listing.id}
                    onClick={() => setOpenMenuId((current) => (current === listing.id ? null : listing.id))}
                  >
                    <MoreIcon className="acm-listing-menu__icon" />
                  </button>

                  {openMenuId === listing.id ? (
                    <div className="acm-listing-menu__panel" role="menu">
                      <button type="button" role="menuitem" className="acm-listing-menu__item" onClick={() => void runMenuAction("edit", listing)}>
                        Edit
                      </button>
                      {listing.status === "published" ? (
                        <button type="button" role="menuitem" className="acm-listing-menu__item" onClick={() => void runMenuAction("sold", listing)}>
                          Mark Sold
                        </button>
                      ) : null}
                      <button type="button" role="menuitem" className="acm-listing-menu__item" onClick={() => void runMenuAction("delete", listing)}>
                        Delete
                      </button>
                      <button type="button" role="menuitem" className="acm-listing-menu__item" onClick={() => void runMenuAction("promote", listing)}>
                        Promote
                      </button>
                      <button type="button" role="menuitem" className="acm-listing-menu__item" onClick={() => void runMenuAction("share", listing)}>
                        Share
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={pendingDelete !== null}
        onClose={closeDialog}
        title="Delete Listing?"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p>This action permanently deletes this listing and cannot be undone.</p>
        {deleteError ? (
          <p className="mt-ds-2 text-sm text-danger" role="alert">
            {deleteError}
          </p>
        ) : null}
      </Dialog>

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
    </AccountModuleShell>
  );
}
