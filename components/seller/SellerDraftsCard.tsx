"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { SellerEmptyState } from "@/components/seller/SellerEmptyState";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerDraftsCard() {
  const { data } = useSellerDashboard();

  return (
    <SellerSection id="seller-drafts" title="Drafts" href="/seller/listings?filter=draft" linkLabel="Manage drafts">
      {data.draftListings.length === 0 ? (
        <SellerEmptyState title="No draft listings" message="Save a listing as draft to continue later." />
      ) : (
        <div className="seller-scroll">
          {data.draftListings.map((listing) => (
            <Link key={listing.id} href={`/seller/listings/${listing.id}/edit`} className="seller-draft-card">
              <SafeImage src={listing.imageUrl} alt="" width={170} height={110} className="seller-draft-card__image" />
              <div className="seller-draft-card__body">
                <p className="seller-draft-card__title">{listing.title}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SellerSection>
  );
}
