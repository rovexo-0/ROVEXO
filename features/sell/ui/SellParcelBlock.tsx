"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel, focusRing } from "@/features/sell/ui/sell-classes";
import { SellInlineError, SellNavRow, SellPanelHeader } from "@/features/sell/ui/SellPrimitives";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors, PARCEL_SIZE_OPTIONS, type ParcelSize } from "@/features/sell/types";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";
import { resolveTransactionModeFromFlatPath } from "@/lib/transaction-mode/resolver";
import {
  PARCEL_CARD_PRESENTATION,
  PARCEL_PACKAGING_GUIDE,
} from "@/features/sell/ui/sell-picker-presentation-v1";

const SELECT_ANIM_MS = 200;

function ParcelBoxIllustration({ size }: { size: ParcelSize }) {
  const scale = size === "small" ? 0.72 : size === "medium" ? 0.86 : size === "large" ? 1 : 1.12;
  return (
    <span className="sell-parcel-option__art" aria-hidden style={{ ["--sell-parcel-scale" as string]: scale }}>
      <svg viewBox="0 0 64 64" className="sell-parcel-option__box" fill="none">
        <path
          d="M10 24 L32 12 L54 24 L54 44 L32 56 L10 44 Z"
          fill="#C4A574"
          stroke="#8B6914"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M10 24 L32 36 L54 24" stroke="#8B6914" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M32 36 V56" stroke="#8B6914" strokeWidth="1.5" />
        <path d="M22 20 L42 31" stroke="#A67C2D" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
        <path d="M26 18 L46 29" stroke="#E8D5A3" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      </svg>
    </span>
  );
}

/**
 * Parcel Size Absolute Authority L6 — SMALL / MEDIUM / LARGE / EXTRA LARGE.
 * One tap → 0.2s → auto-save → auto-return. L6: no recommendation badge.
 * Presentation: premium shipping cards (canonical freeze). V1.1 — no search.
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
        <SellPanelHeader title="Parcel Size" onBack={onClose} />

        <div className={cn(RX_MODAL_BODY, "sell-option-picker__body min-h-0 flex-1 overflow-y-auto overscroll-contain pt-ds-2")}>
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
                    aria-label={`${card.title}. ${option.description.replace(/\n/g, " ")}. ${card.weight}`}
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
                      <span className="sell-parcel-option__desc">{option.description}</span>
                      <span className="sell-parcel-option__weight">{card.weight}</span>
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

          <div className="sell-parcel-guide" role="note">
            <span className="sell-parcel-guide__ico" aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10v6M12 7.5h.01" strokeLinecap="round" />
              </svg>
            </span>
            <div className="sell-parcel-guide__copy">
              <p className="sell-parcel-guide__title">Packaging guide</p>
              <p className="sell-parcel-guide__text">{PARCEL_PACKAGING_GUIDE}</p>
            </div>
          </div>
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
