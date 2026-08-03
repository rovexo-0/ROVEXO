"use client";

import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import "@/styles/rovexo/view-profile-v1.css";

/**
 * My Profile v10.0 fail-closed — soft empty Your Store (never Retry / Home / technical errors).
 */
export default function ViewProfileError() {
  return (
    <BetaAppShell bottomNavTab="account">
      <div className="vp-v1" data-view-profile="v10.0-your-store-error" data-fail-closed="empty-only">
        <CanonicalPageHeader title="" backHref="/account" />
        <div className="vp-v1__main" style={{ padding: 16 }}>
          <div className="vp-v1__store-empty" data-your-store-empty="v10.0">
            <p className="vp-v1__store-empty-title">You haven&apos;t listed any items yet.</p>
            <p className="vp-v1__store-empty-body">
              Start selling on ROVEXO
              <br />
              and reach thousands of buyers.
            </p>
            <Link href="/sell" className="vp-v1__create-listing" data-create-listing="v10.0">
              <span className="vp-v1__create-listing-icon" aria-hidden>
                +
              </span>
              Create Listing
            </Link>
          </div>
        </div>
      </div>
    </BetaAppShell>
  );
}
