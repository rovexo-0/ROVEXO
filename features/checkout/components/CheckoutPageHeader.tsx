"use client";

import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";

type CheckoutPageHeaderProps = {
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
};

/** @deprecated Use CanonicalPageHeader directly. */
export function CheckoutPageHeader({
  backHref = "/",
  backLabel = "Listing",
  onBack,
}: CheckoutPageHeaderProps) {
  return (
    <CanonicalPageHeader
      title="Checkout"
      backHref={backHref}
      backLabel={onBack ? "Go back" : backLabel}
      onBack={onBack}
      className="bg-white"
    />
  );
}
