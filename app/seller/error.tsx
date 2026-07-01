"use client";

import { SellerErrorState } from "@/components/seller/SellerErrorState";

export default function SellerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="seller-page">
      <SellerErrorState message={error.message || "Something went wrong. Please try again."} />
      <button type="button" className="seller-hero__cta" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
