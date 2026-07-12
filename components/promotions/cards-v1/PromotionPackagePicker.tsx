"use client";

import { useCallback, useState } from "react";
import {
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalModal,
} from "@/src/components/canonical";
import { BOOST_PACKAGE_TIERS } from "@/lib/promotions/canonical-tools";
import { formatPromotionPrice } from "@/lib/promotions/catalog";

type PromotionPackagePickerProps = {
  open: boolean;
  onClose: () => void;
};

export function PromotionPackagePicker({ open, onClose }: PromotionPackagePickerProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async (packageId: string) => {
    setBusyId(packageId);
    setError(null);

    try {
      const response = await fetch("/api/promotions/seller-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "boost_package", packageId }),
      });

      const payload = (await response.json()) as { success?: boolean; url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Unable to start checkout.");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setError("Unable to start checkout.");
    } finally {
      setBusyId(null);
    }
  }, []);

  return (
    <CanonicalModal
      open={open}
      variant="information"
      title="Choose Boost Package"
      cancelLabel="Close"
      onClose={onClose}
    >
      <div className="flex flex-col gap-ds-3">
        <CanonicalInfoBlock variant="description">
          Includes Featured Store, automatic bump for every active listing, and automatic expiration.
        </CanonicalInfoBlock>

        <div role="listbox" aria-label="Boost packages">
          {BOOST_PACKAGE_TIERS.map((tier) => (
            <CanonicalMenuRow
              key={tier.id}
              title={tier.label}
              value={formatPromotionPrice(tier.priceCents)}
              disabled={busyId !== null}
              onClick={() => void startCheckout(tier.id)}
            />
          ))}
        </div>

        {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}
      </div>
    </CanonicalModal>
  );
}
