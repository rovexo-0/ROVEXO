"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel, focusRing } from "@/features/sell/ui/sell-classes";
import { SellRowsCard, SellCompactRow, SellToggle, SellInlineError, SellPanelHeader, SellSection } from "@/features/sell/ui/SellPrimitives";
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
      <div className={sellPanel}>
        <SellPanelHeader title="Parcel size" onBack={onClose} />

        <div className={cn(RX_MODAL_BODY, "px-ds-4 pt-ds-3")}>
          <p className="px-ds-1 pb-ds-3 text-sm text-text-secondary">
            Choose the closest size so buyers get accurate shipping.
          </p>
          <ul className="flex flex-col gap-ds-2" role="radiogroup" aria-label="Parcel size">
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
                      <span className="flex items-center gap-ds-2">
                        <span className="text-base font-semibold text-text-primary">{option.label}</span>
                        {option.recommended ? (
                          <span className="rounded-ds-sm bg-primary/10 px-ds-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-primary">Recommended</span>
                        ) : null}
                      </span>
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

export function SellShippingBlock() {
  const { draft, updateDraft, showValidation } = useSell();
  const [parcelOpen, setParcelOpen] = useState(false);

  const errors = useMemo(
    () => getListingValidationErrors(draft, { mode: "quick", showErrors: showValidation }),
    [draft, showValidation],
  );

  const directContact = draft.categoryPath
    ? isDirectContactMode(resolveTransactionModeFromFlatPath(draft.categoryPath))
    : false;

  if (directContact) {
    return (
      <SellSection title="Shipping" aria-label="Shipping">
        <p className="text-sm text-text-secondary">
          Arranged directly between buyer and seller — no postage required.
        </p>
      </SellSection>
    );
  }

  const homeDelivery = draft.shippingMethod !== "collection_only";
  const collectionEnabled = draft.collectionEnabled;
  const parcelLabel = PARCEL_SIZE_OPTIONS.find((option) => option.id === draft.parcelSize)?.label ?? "";

  const setHomeDelivery = (enabled: boolean) => {
    if (!enabled && !collectionEnabled) {
      updateDraft({ collectionEnabled: true, shippingMethod: "collection_only" });
      return;
    }
    updateDraft({
      shippingMethod: enabled ? "delivery_available" : "collection_only",
    });
  };

  const setCollection = (enabled: boolean) => {
    if (!enabled && !homeDelivery) {
      updateDraft({ collectionEnabled: false, shippingMethod: "delivery_available" });
      return;
    }
    updateDraft({
      collectionEnabled: enabled,
      shippingMethod: homeDelivery ? "delivery_available" : "collection_only",
    });
  };

  return (
    <SellSection title="Shipping" aria-label="Shipping">
      <div className="flex flex-col gap-ds-1">
        <SellRowsCard>
          {homeDelivery ? (
            <SellCompactRow
              label="Parcel size"
              value={parcelLabel}
              placeholder="Select parcel size"
              hasError={Boolean(errors.parcelSize)}
              onClick={() => setParcelOpen(true)}
              ariaLabel="Select parcel size"
            />
          ) : null}

          <div className="flex items-center justify-between gap-ds-3 px-ds-4 py-ds-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">Home delivery</p>
              <p className="text-xs text-text-muted">Shipped via courier</p>
            </div>
            <SellToggle checked={homeDelivery} onChange={setHomeDelivery} label="Home delivery" />
          </div>

          <div className="flex items-center justify-between gap-ds-3 border-t border-border px-ds-4 py-ds-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">Collection</p>
              <p className="text-xs text-text-muted">Buyer collects in person</p>
            </div>
            <SellToggle checked={collectionEnabled} onChange={setCollection} label="Collection" />
          </div>
        </SellRowsCard>

        <p className="px-ds-1 text-xs text-text-muted">Buyer pays shipping.</p>
        <SellInlineError message={errors.parcelSize} />

        {parcelOpen ? (
          <ParcelPicker
            value={draft.parcelSize}
            onClose={() => setParcelOpen(false)}
            onSelect={(size) => updateDraft({ parcelSize: size })}
          />
        ) : null}
      </div>
    </SellSection>
  );
}
