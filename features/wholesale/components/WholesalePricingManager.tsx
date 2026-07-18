"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CanonicalCard } from "@/src/components/canonical";
import type { WholesalePricingTier } from "@/lib/wholesale/types";

export function WholesalePricingManager() {
  const [tiers, setTiers] = useState<WholesalePricingTier[]>([]);
  const [minQuantity, setMinQuantity] = useState("10");
  const [unitPrice, setUnitPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    void fetch("/api/wholesale/pricing")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { tiers?: WholesalePricingTier[] } | null) => setTiers(payload?.tiers ?? []))
      .catch(() => setTiers([]));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setBusy(true);
    try {
      await fetch("/api/wholesale/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minQuantity: Number(minQuantity),
          unitPrice: Number(unitPrice),
        }),
      });
      setUnitPrice("");
      load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/wholesale/pricing?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <CanonicalCard variant="medium" className="w-full">
      <h2 className="text-lg font-semibold">Bulk pricing tiers</h2>
      <div className="mt-ds-4 grid gap-ds-3 sm:grid-cols-3">
        <input
          value={minQuantity}
          onChange={(event) => setMinQuantity(event.target.value)}
          type="number"
          min={1}
          placeholder="Min quantity"
          className="rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
        />
        <input
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
          type="number"
          min={0}
          step="0.01"
          placeholder="Unit price"
          className="rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
        />
        <Button disabled={busy || !unitPrice} onClick={() => void create()}>
          Add tier
        </Button>
      </div>
      <ul className="mt-ds-4 space-y-ds-2 text-sm">
        {tiers.map((tier) => (
          <li key={tier.id} className="flex items-center justify-between gap-ds-3 border-b border-border pb-ds-2">
            <span>
              MOQ {tier.minQuantity} · £{tier.unitPrice.toFixed(2)} {tier.currency}
            </span>
            <button type="button" className="text-text-muted hover:text-text-primary" onClick={() => void remove(tier.id)}>
              Remove
            </button>
          </li>
        ))}
        {!tiers.length ? <li className="text-text-secondary">No pricing tiers yet.</li> : null}
      </ul>
    </CanonicalCard>
  );
}
