"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { Skeleton, SkeletonAvatar, SkeletonText } from "@/components/ui/Skeleton";
import "@/styles/rovexo/view-profile-v1.css";

const LOAD_TIMEOUT_MS = 3000;

/**
 * My Profile v10.0 loading — max 3s, then soft empty Your Store (never fail panels or white forever).
 */
export default function ViewProfileLoading() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (timedOut) {
    return (
      <BetaAppShell bottomNavTab="account">
        <div
          className="vp-v1"
          data-view-profile="v10.0-load-timeout"
          data-fail-closed="empty-only"
        >
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

  return (
    <BetaAppShell>
      <div
        className="vp-v1"
        data-view-profile="v10.0-skeleton"
        aria-busy="true"
        aria-label="Loading profile"
      >
        <CanonicalPageHeader title="" backHref="/account" />
        <div className="vp-v1__main" style={{ padding: "20px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <SkeletonAvatar size={88} />
            <SkeletonText lines={2} className="w-40" />
            <Skeleton className="h-4 w-32" rounded="md" />
          </div>
          <div
            style={{
              display: "flex",
              gap: 0,
              marginTop: 20,
              borderBottom: "1px solid rgb(15 23 42 / 0.08)",
            }}
          >
            <Skeleton className="mx-auto mb-2 h-8 w-16" rounded="md" />
            <Skeleton className="mx-auto mb-2 h-8 w-16" rounded="md" />
            <Skeleton className="mx-auto mb-2 h-8 w-16" rounded="md" />
          </div>
          <div className="grid grid-cols-2 gap-3" style={{ marginTop: 16 }}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full" rounded="lg" />
            ))}
          </div>
        </div>
      </div>
    </BetaAppShell>
  );
}
