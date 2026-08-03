"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel } from "@/features/sell/ui/sell-classes";
import { SellFlowHeader } from "@/features/sell/ui/SellPrimitives";
import {
  SIZE_ENGINE_V1,
  buildStandardSelection,
  encodeSizeForStorage,
  parseStoredSize,
  sectionTitleForKind,
  selectionFromCustom,
  standardRowsForKind,
  type SizeEngineKind,
  type SizeSelectionV1,
} from "@/lib/size";
import { CustomSizeModal } from "@/features/size/components/CustomSizeModal";
import { SizeGuideModal } from "@/features/size/components/SizeGuideModal";
import styles from "@/features/size/components/SizeSelector.module.css";

export type SizeSelectorProps = {
  kind: SizeEngineKind;
  /** Current draft / listing size storage string. */
  value?: string | null;
  /** Optional recommended row id (clothing letter or UK N). */
  recommendedId?: string | null;
  /** ← without selection — discard, return to Sell. */
  onBack: () => void;
  /** ✕ / dismiss — discard, return to Sell (ModalContainer). */
  onClose: () => void;
  /** Auto-save + auto-return after standard tap or custom Save. */
  onSelect: (storageValue: string, selection: SizeSelectionV1) => void;
};

/**
 * ROVEXO Size Engine v1.0 — temporary selector (Owner AUTO RETURN + Sell header SSOT).
 * Header = SellFlowHeader only — never a dedicated SizeHeader.
 */
export function SizeSelector({
  kind,
  value,
  recommendedId = null,
  onBack,
  onClose,
  onSelect,
}: SizeSelectorProps) {
  const initial = useMemo(() => parseStoredSize(value), [value]);
  const [selection, setSelection] = useState<SizeSelectionV1 | null>(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const lockingRef = useRef(false);

  const rows = standardRowsForKind(kind);
  const sectionTitle = sectionTitleForKind(kind);
  const isCustom = selection?.size_type === "custom" && !pendingId;

  const dismiss = () => {
    if (lockingRef.current) return;
    onBack();
  };

  const commitAndReturn = (next: SizeSelectionV1) => {
    onSelect(encodeSizeForStorage(next), next);
  };

  const selectStandard = (id: string) => {
    if (lockingRef.current || customOpen || guideOpen) return;
    const next = buildStandardSelection(kind, id);
    if (!next) return;
    lockingRef.current = true;
    setPendingId(id);
    setSelection(next);
    window.setTimeout(() => {
      commitAndReturn(next);
    }, SIZE_ENGINE_V1.autoReturnMs);
  };

  return (
    <ModalContainer
      open
      onClose={onClose}
      variant="fullscreen"
      zIndex={200}
      ariaLabel={SIZE_ENGINE_V1.title}
      lockScroll={false}
    >
      <div
        className={cn(sellPanel, "sell-compact-picker flex min-h-0 flex-1 flex-col")}
        data-size-engine={SIZE_ENGINE_V1.version}
        data-size-kind={kind}
        data-size-auto-return="true"
      >
        <SellFlowHeader title="Size" onBack={dismiss} />

        <div
          className={cn(
            RX_MODAL_BODY,
            styles["size-engine__body"],
            styles["size-engine__body--auto-return"],
            "sell-option-picker__body min-h-0 flex-1 overflow-y-auto overscroll-contain",
          )}
        >
          <p className={styles["size-engine__subtitle"]}>{SIZE_ENGINE_V1.subtitle}</p>

          <div className={styles["size-engine__section-head"]}>
            <h2 className={styles["size-engine__section-title"]}>{sectionTitle}</h2>
            <button
              type="button"
              className={styles["size-engine__guide"]}
              onClick={() => setGuideOpen(true)}
              disabled={Boolean(pendingId)}
            >
              Size guide
            </button>
          </div>

          <ul className={styles["size-engine__list"]} role="listbox" aria-label={sectionTitle}>
            {rows.map((row) => {
              const selected =
                (!isCustom &&
                  selection?.size_type === "standard" &&
                  selection.size_value === row.id) ||
                pendingId === row.id;
              const showRecommended = Boolean(recommendedId) && recommendedId === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={Boolean(pendingId)}
                    className={`${styles["size-engine__row"]} ${
                      selected ? styles["size-engine__row--selected"] : ""
                    } ${pendingId === row.id ? styles["size-engine__row--flash"] : ""}`}
                    onClick={() => selectStandard(row.id)}
                  >
                    <span className={styles["size-engine__radio"]} aria-hidden />
                    <span className={styles["size-engine__row-main"]}>
                      <span className={styles["size-engine__row-label"]}>{row.label}</span>
                      {row.secondary ? (
                        <span className={styles["size-engine__row-secondary"]}>{row.secondary}</span>
                      ) : null}
                    </span>
                    {showRecommended ? (
                      <span className={styles["size-engine__badge"]}>Recommended</span>
                    ) : (
                      <span />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className={`${styles["size-engine__custom"]} ${
              isCustom ? styles["size-engine__custom--active"] : ""
            }`}
            onClick={() => setCustomOpen(true)}
            disabled={Boolean(pendingId)}
            aria-label={isCustom ? `Edit custom size ${selection?.size_value}` : "Enter custom size"}
          >
            {isCustom ? (
              <span className={styles["size-engine__custom-check"]} aria-hidden>
                ✓
              </span>
            ) : (
              <span className={styles["size-engine__custom-plus"]} aria-hidden>
                ＋
              </span>
            )}
            <span className={styles["size-engine__row-main"]}>
              <span className={styles["size-engine__row-label"]}>
                {isCustom ? "Custom" : "Custom size..."}
              </span>
              <span className={styles["size-engine__row-secondary"]}>
                {isCustom ? selection?.size_value : "Enter your size manually"}
              </span>
            </span>
            <span aria-hidden>›</span>
          </button>

          <div className={styles["size-engine__info"]} role="note">
            <span aria-hidden>ⓘ</span>
            <span>
              Can&apos;t find your size? Select &apos;Custom size&apos; to enter it manually.
            </span>
          </div>
        </div>

        <SizeGuideModal open={guideOpen} kind={kind} onClose={() => setGuideOpen(false)} />
        <CustomSizeModal
          open={customOpen}
          initialValue={isCustom ? selection?.size_value ?? "" : ""}
          canRemove={isCustom}
          onClose={() => setCustomOpen(false)}
          onSave={(customValue) => {
            const next = selectionFromCustom(customValue);
            if ("error" in next) return;
            setCustomOpen(false);
            setSelection(next);
            commitAndReturn(next);
          }}
          onRemove={() => {
            setSelection(null);
            setCustomOpen(false);
          }}
        />
      </div>
    </ModalContainer>
  );
}
