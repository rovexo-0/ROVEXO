"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel, focusRing } from "@/features/sell/ui/sell-classes";
import { SellInlineError, SellNavRow, SellFlowHeader } from "@/features/sell/ui/SellPrimitives";
import { useSellActions, useSellDraft } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors, PARCEL_SIZE_OPTIONS, type ParcelSize } from "@/features/sell/types";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";
import { resolveTransactionModeFromFlatPath } from "@/lib/transaction-mode/resolver";
import { PARCEL_CARD_PRESENTATION } from "@/features/sell/ui/sell-picker-presentation-v1";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

const SELECT_ANIM_MS = 200;

function ParcelBoxIllustration({ size }: { size: ParcelSize }) {
  const emojiSize = size === "small" ? 28 : size === "medium" ? 34 : 40;
  return (
    <span className="sell-parcel-option__art" aria-hidden>
      <PlatformEmoji emoji={PLATFORM_EMOJI.listings} size={emojiSize} className="sell-parcel-option__box" />
    </span>
  );
}

/**
 * Sell Parcel Size UX — select one size only.
 * Labels / weight / max dimensions come from canonical SSOT.
 * No weight/dimension inputs · no shipping-provider UI · no freeform measurements.
 */
function ParcelPicker({
  value,
  onClose,
  onSelect,
}: {
  value: ParcelSize | null;
  onClose: () => void;
  onSelect: (size: ParcelSize) => void;
}) {
  const [pendingId, setPendingId] = useState<ParcelSize | null>(null);

  const choose = (size: ParcelSize) => {
    if (pendingId) return;
    setPendingId(size);
    onSelect(size);
    window.setTimeout(() => {
      onClose();
    }, SELECT_ANIM_MS);
  };

  return (
    <ModalContainer
      open
      onClose={onClose}
      variant="fullscreen"
      zIndex={200}
      ariaLabel="Select parcel size"
      lockScroll={false}
    >
      <div className={cn(sellPanel, "sell-compact-picker flex min-h-0 flex-1 flex-col")}>
        <SellFlowHeader title="Parcel size" onBack={onClose} />

        <div
          className={cn(
            RX_MODAL_BODY,
            "sell-option-picker__body min-h-0 flex-1 overflow-y-auto overscroll-contain pt-ds-2",
          )}
        >
          <ul className="sell-parcel-picker flex flex-col" role="radiogroup" aria-label="Parcel size">
            {PARCEL_SIZE_OPTIONS.map((option) => {
              const active = (pendingId ?? value) === option.id;
              const card = PARCEL_CARD_PRESENTATION[option.id];
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={`${card.title}. ${card.weight}. ${card.maxDimensions}`}
                    onClick={() => choose(option.id)}
                    className={cn(
                      "sell-parcel-option flex w-full items-center text-left",
                      active && "sell-parcel-option--active",
                      pendingId === option.id && "sell-parcel-option--pending",
                      focusRing,
                    )}
                  >
                    <ParcelBoxIllustration size={option.id} />
                    <span className="sell-parcel-option__copy min-w-0 flex-1">
                      <span className="sell-parcel-option__title-row">
                        <span className="sell-parcel-option__label">{card.title}</span>
                        {active ? (
                          <span className="sell-option-picker__selected-badge" aria-hidden>
                            Selected
                          </span>
                        ) : null}
                      </span>
                      <span className="sell-parcel-option__desc">{card.weight}</span>
                      <span className="sell-parcel-option__weight">{card.maxDimensions}</span>
                    </span>
                    <span
                      className={cn(
                        "sell-parcel-option__radio shrink-0",
                        active && "sell-parcel-option__radio--checked",
                      )}
                      aria-hidden
                    />
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

export function SellParcelBlock({
  bare = false,
  onParcelSelected,
}: {
  bare?: boolean;
  onParcelSelected?: () => void;
}) {
  const { draft, showValidation } = useSellDraft();
  const { updateDraft } = useSellActions();
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

  void bare;

  return (
    <div className="flex flex-col gap-ds-1">
      <SellNavRow
        label="Parcel Size"
        value={parcelLabel || undefined}
        hasError={Boolean(errors.parcelSize)}
        onClick={() => setParcelOpen(true)}
        ariaLabel="Parcel Size"
        iconFieldId="parcel"
      />
      <SellInlineError message={errors.parcelSize} />

      {parcelOpen ? (
        <ParcelPicker
          value={draft.parcelSize}
          onClose={() => setParcelOpen(false)}
          onSelect={(size) => {
            updateDraft({ parcelSize: size, shippingMethod: "delivery_available" });
            onParcelSelected?.();
          }}
        />
      ) : null}
    </div>
  );
}
