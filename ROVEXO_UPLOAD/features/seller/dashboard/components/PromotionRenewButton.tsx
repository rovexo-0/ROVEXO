"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PromotionType } from "@/lib/promotions/config";

type PromotionRenewButtonProps = {
  productId: string;
  type: PromotionType;
  durationId: string;
  label?: string;
};

export function PromotionRenewButton({
  productId,
  type,
  durationId,
  label = "Renew",
}: PromotionRenewButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRenew() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/promotions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, type, durationId }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.url) {
        setError(payload.error ?? "Unable to start checkout.");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setError("Unable to start checkout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-ds-1">
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleRenew()}>
        {busy ? "Starting…" : label}
      </Button>
      {error && <p className="max-w-[140px] text-right text-[0.6875rem] text-danger">{error}</p>}
    </div>
  );
}
