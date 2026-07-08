"use client";

import { SellSection, SellToggle } from "@/features/sell/ui/SellPrimitives";
import { useSell } from "@/features/sell/context/SellProvider";

export function SellOptionsBlock() {
  const { draft, updateDraft } = useSell();

  return (
    <SellSection aria-label="Accept offers">
      <div className="flex items-center justify-between gap-ds-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">Accept offers</p>
          <p className="text-xs text-text-muted">Let buyers negotiate the price</p>
        </div>
        <SellToggle checked={draft.acceptOffers} onChange={(acceptOffers) => updateDraft({ acceptOffers })} label="Accept offers" />
      </div>
    </SellSection>
  );
}
