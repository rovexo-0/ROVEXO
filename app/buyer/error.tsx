"use client";

import { BuyerErrorState } from "@/components/buyer/BuyerErrorState";

export default function BuyerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="buyer-page">
      <BuyerErrorState message={error.message || "Something went wrong. Please try again."} />
      <button type="button" className="buyer-hero__cta" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
