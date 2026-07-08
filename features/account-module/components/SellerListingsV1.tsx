"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import type { ListingFilter, SellerListing } from "@/lib/listings/types";
import type { SellerListingsData } from "@/lib/seller/listings-queries";
import { formatCurrency } from "@/lib/wallet/utils";

function TrashLineIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 .8 12a1 1 0 0 0 1 .93h6.4a1 1 0 0 0 1-.93L17 7" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

const TABS: { id: ListingFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "sold", label: "Sold" },
  { id: "draft", label: "Draft" },
  { id: "paused", label: "Paused" },
  { id: "expired", label: "Expired" },
];

function statusLabel(listing: SellerListing): string {
  if (listing.isAuctionExpired) return "Expired";
  if (listing.moderationStatus === "pending" || listing.moderationStatus === "blocked") {
    return "Pending";
  }
  if (listing.status === "published") return "Active";
  if (listing.status === "draft") return "Draft";
  if (listing.status === "paused") return "Paused";
  if (listing.status === "sold") return "Sold";
  return listing.status;
}

function statusClass(listing: SellerListing): string {
  const label = statusLabel(listing);
  if (label === "Active") return "acm-badge acm-badge--active";
  if (label === "Sold") return "acm-badge acm-badge--sold";
  if (label === "Paused" || label === "Expired") return "acm-badge acm-badge--paused";
  if (label === "Pending") return "acm-badge acm-badge--draft";
  return "acm-badge acm-badge--draft";
}

type SellerListingsV1Props = {
  data: SellerListingsData;
};

export function SellerListingsV1({ data }: SellerListingsV1Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter =
    (searchParams.get("filter") as ListingFilter | null) ?? data.filter ?? "all";
  const listings = data.listings;

  const [pendingDelete, setPendingDelete] = useState<SellerListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  return (
    <AccountModuleShell title="My Listings" backHref="/account" version="v1.0">
      <div className="acm-tabs" role="tablist" aria-label="Listing filters" data-listings-version="v1.0">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "all" ? "/seller/listings" : `/seller/listings?filter=${tab.id}`}
            role="tab"
            aria-selected={activeFilter === tab.id}
            className={activeFilter === tab.id ? "acm-tabs__tab acm-tabs__tab--active" : "acm-tabs__tab"}
          >
            {tab.label}
          </Link>
        ))}
      </div>

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
                <Link href={`/listing/${listing.slug}`} className="acm-listing">
                  <div className="acm-listing__thumb">
                    <SafeImage src={listing.imageUrl} alt="" fill sizes="72px" className="object-cover" />
                  </div>
                  <div className="acm-listing__body">
                    <p className="acm-listing__title">{listing.title}</p>
                    <p className="acm-listing__price">{formatCurrency(listing.price)}</p>
                    <div className="acm-listing__meta">
                      <span className={statusClass(listing)}>{statusLabel(listing)}</span>
                      <span className="acm-listing__stats">
                        <span>{listing.views} views</span>
                      </span>
                    </div>
                  </div>
                  <span className="acm-listing__chevron" aria-hidden>
                    <ChevronRightLineIcon />
                  </span>
                </Link>
                <button
                  type="button"
                  className="acm-listing__delete"
                  aria-label={`Delete ${listing.title}`}
                  onClick={() => {
                    setDeleteError(null);
                    setPendingDelete(listing);
                  }}
                >
                  <TrashLineIcon className="acm-listing__delete-icon" />
                </button>
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
    </AccountModuleShell>
  );
}
