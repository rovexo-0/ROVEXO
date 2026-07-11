"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel, focusRing } from "@/features/sell/ui/sell-classes";
import { SellRowsCard, SellCompactRow, SellInlineError, SellPanelHeader, SellSection } from "@/features/sell/ui/SellPrimitives";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors, PARCEL_SIZE_OPTIONS, type ParcelSize } from "@/features/sell/types";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";
import { resolveTransactionModeFromFlatPath } from "@/lib/transaction-mode/resolver";

function ParcelPicker({
  value,
  onClose,
  onSelect,
}: {
  value: ParcelSize | null;
  onClose: () => void;
  onSelect: (size: ParcelSize) => void;
}) {
  const choose = (size: ParcelSize) => {
    onSelect(size);
    onClose();
  };

  return (
    <ModalContainer open onClose={onClose} variant="fullscreen" zIndex={200} ariaLabel="Select parcel size">
      <div className={cn(sellPanel, "flex min-h-0 flex-1 flex-col")}>
        <SellPanelHeader title="Parcel size" onBack={onClose} />
        <div className={cn(RX_MODAL_BODY, "min-h-0 flex-1 overflow-y-auto overscroll-contain px-ds-4 pt-ds-3")}>
          <p className="px-ds-1 pb-ds-3 text-sm text-text-secondary">
            Choose the closest size. Buyer pays shipping — calculated at checkout.
          </p>
          <ul className="flex flex-col gap-ds-2 pb-ds-4" role="radiogroup" aria-label="Parcel size">
            {PARCEL_SIZE_OPTIONS.filter((option) => option.id !== "custom").map((option) => {
              const active = value === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => choose(option.id)}
                    className={cn(
                      "flex min-h-[64px] w-full items-start gap-ds-3 rounded-ds-md border-2 p-ds-4 text-left transition-colors active:bg-surface-muted",
                      active ? "border-primary bg-primary/5" : "border-border bg-surface-muted/40",
                      focusRing,
                    )}
                  >
                    <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-ds-full border-2", active ? "border-primary" : "border-border")} aria-hidden>
                      {active ? <span className="h-3 w-3 rounded-ds-full bg-primary" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-base font-semibold text-text-primary">{option.label}</span>
                      <span className="mt-0.5 block text-sm text-text-secondary">{option.description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </ModalContainer>
  );
}

export function SellParcelBlock() {
  const { draft, updateDraft, showValidation } = useSell();
  const [parcelOpen, setParcelOpen] = useState(false);

  const errors = useMemo(
    () => getListingValidationErrors(draft, { mode: "quick", showErrors: showValidation }),
    [draft, showValidation],
  );

  const directContact = draft.categoryPath
    ? isDirectContactMode(resolveTransactionModeFromFlatPath(draft.categoryPath))
    : false;

  if (directContact) return null;

  const parcelLabel = PARCEL_SIZE_OPTIONS.find((option) => option.id === draft.parcelSize)?.label ?? "";

  return (
    <SellSection title="Parcel size" aria-label="Parcel size">
      <div className="flex flex-col gap-ds-1">
        <SellRowsCard>
          <SellCompactRow
            label="Parcel size"
            value={parcelLabel}
            placeholder="Select parcel size"
            hasError={Boolean(errors.parcelSize)}
            onClick={() => setParcelOpen(true)}
            ariaLabel="Select parcel size"
          />
        </SellRowsCard>
        <SellInlineError message={errors.parcelSize} />

        {parcelOpen ? (
          <ParcelPicker
            value={draft.parcelSize}
            onClose={() => setParcelOpen(false)}
            onSelect={(size) => updateDraft({ parcelSize: size, shippingMethod: "delivery_available" })}
          />
        ) : null}
      </div>
    </SellSection>
  );
}
