"use client";

import {
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { bumpPendingTextVersion } from "@/lib/sell/pending-text-store";
import { sellInputDiag } from "@/lib/sell/sell-input-diagnostics";
import { sellProfileRender } from "@/lib/sell/sell-profiler";
import {
  clampListingTitle,
  LISTING_TITLE_MAX,
  validateListingTitle,
} from "@/lib/sell/listing-title";
import { CategorySelectScreen } from "@/features/sell/components/CategorySelectScreen";
import { ParcelSizeScreen } from "@/features/sell/components/ParcelSizeScreen";
import { FieldError, fieldErrorClassName } from "@/features/sell/components/FieldError";
import { sellFieldClassName, sellFormCardClassName } from "@/features/sell/components/sell-ui";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors, PARCEL_SIZE_OPTIONS } from "@/features/sell/types";
import { isDirectContactMode } from "@/lib/transaction-mode/capabilities";
import { resolveTransactionModeFromFlatPath } from "@/lib/transaction-mode/resolver";

const PENDING_TEXT_BUMP_MS = 300;

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5 shrink-0 text-text-muted" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function NavRow({
  label,
  value,
  placeholder,
  hasError,
  onClick,
  ariaLabel,
}: {
  label: string;
  value: ReactNode;
  placeholder: string;
  hasError: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex w-full items-center gap-ds-3 rounded-ds-md bg-surface-muted/60 px-ds-4 text-left transition-colors active:bg-surface-muted",
        fieldErrorClassName(hasError),
        focusRing,
      )}
      style={{ minHeight: 56 }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-text-muted">{label}</span>
        <span
          className={cn(
            "block truncate text-base font-semibold",
            hasValue ? "text-text-primary" : "text-text-muted",
          )}
        >
          {hasValue ? value : placeholder}
        </span>
      </span>
      <ChevronRight />
    </button>
  );
}

export const ListingForm = memo(function ListingForm() {
  const {
    draft,
    updateDraft,
    setCategoryPath,
    showValidation,
    pendingTitleRef,
    pendingDescriptionRef,
    flushTitleCommitRef,
    flushDescriptionCommitRef,
    syncTitleToDraft,
    syncDescriptionToDraft,
  } = useSell();

  const titleId = useId();
  const descriptionId = useId();
  const priceId = useId();

  const [localTitle, setLocalTitle] = useState(draft.title);
  const [localDescription, setLocalDescription] = useState(draft.description);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [parcelOpen, setParcelOpen] = useState(false);
  const localTitleRef = useRef(localTitle);
  const localDescriptionRef = useRef(localDescription);
  const isTypingTitleRef = useRef(false);
  const isTypingDescriptionRef = useRef(false);
  const pendingBumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderCountRef = useRef(0);

  const errors = useMemo(
    () => getListingValidationErrors(draft, { mode: "quick", showErrors: showValidation }),
    [draft, showValidation],
  );

  useEffect(() => {
    renderCountRef.current += 1;
    localTitleRef.current = localTitle;
    localDescriptionRef.current = localDescription;
    sellProfileRender("ListingForm", { count: renderCountRef.current });
    sellInputDiag("ListingForm.render", { count: renderCountRef.current });
  });

  useEffect(() => {
    flushTitleCommitRef.current = () => {
      isTypingTitleRef.current = false;
      syncTitleToDraft(localTitleRef.current);
    };
    return () => {
      flushTitleCommitRef.current = null;
    };
  }, [flushTitleCommitRef, syncTitleToDraft]);

  useEffect(() => {
    flushDescriptionCommitRef.current = () => {
      isTypingDescriptionRef.current = false;
      syncDescriptionToDraft(localDescriptionRef.current);
    };
    return () => {
      flushDescriptionCommitRef.current = null;
    };
  }, [flushDescriptionCommitRef, syncDescriptionToDraft]);

  useEffect(() => {
    if (isTypingTitleRef.current) return;
    setLocalTitle((current) => (current === draft.title ? current : draft.title));
    pendingTitleRef.current = draft.title;
  }, [draft.title, pendingTitleRef]);

  useEffect(() => {
    if (isTypingDescriptionRef.current) return;
    setLocalDescription((current) => (current === draft.description ? current : draft.description));
    pendingDescriptionRef.current = draft.description;
  }, [draft.description, pendingDescriptionRef]);

  useEffect(
    () => () => {
      if (pendingBumpTimerRef.current) {
        clearTimeout(pendingBumpTimerRef.current);
      }
    },
    [],
  );

  const schedulePendingTextBump = () => {
    if (pendingBumpTimerRef.current) {
      clearTimeout(pendingBumpTimerRef.current);
    }
    pendingBumpTimerRef.current = setTimeout(() => {
      pendingBumpTimerRef.current = null;
      bumpPendingTextVersion();
    }, PENDING_TEXT_BUMP_MS);
  };

  const flushPendingTextBump = () => {
    if (pendingBumpTimerRef.current) {
      clearTimeout(pendingBumpTimerRef.current);
      pendingBumpTimerRef.current = null;
    }
    bumpPendingTextVersion();
  };

  const titleError =
    showValidation ? validateListingTitle(localTitle, { required: showValidation }) : undefined;

  const categoryDisplay = draft.categoryPath?.pathLabel ?? "";
  const parcelLabel = PARCEL_SIZE_OPTIONS.find((option) => option.id === draft.parcelSize)?.label ?? "";
  const directContact = draft.categoryPath
    ? isDirectContactMode(resolveTransactionModeFromFlatPath(draft.categoryPath))
    : false;

  return (
    <section aria-label="Listing details" className={cn(sellFormCardClassName, "gap-ds-4")}>
      <div className="flex flex-col gap-ds-1">
        <input
          id={titleId}
          type="text"
          value={localTitle}
          onChange={(event) => {
            const next = clampListingTitle(event.target.value);
            isTypingTitleRef.current = true;
            setLocalTitle(next);
            pendingTitleRef.current = next;
            schedulePendingTextBump();
          }}
          onBlur={() => {
            isTypingTitleRef.current = false;
            syncTitleToDraft(localTitleRef.current);
            flushPendingTextBump();
          }}
          placeholder="What are you selling?"
          maxLength={LISTING_TITLE_MAX}
          autoComplete="off"
          enterKeyHint="next"
          aria-label="Listing title"
          className={cn(sellFieldClassName, focusRing, fieldErrorClassName(Boolean(titleError)))}
        />
        <div className="flex items-center justify-between gap-ds-2">
          <FieldError message={titleError} />
          <p className="ml-auto text-xs text-text-muted tabular-nums" aria-live="off">
            {localTitle.length} / {LISTING_TITLE_MAX}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-ds-1">
        <textarea
          id={descriptionId}
          value={localDescription}
          onChange={(event) => {
            isTypingDescriptionRef.current = true;
            const next = event.target.value;
            setLocalDescription(next);
            pendingDescriptionRef.current = next;
            schedulePendingTextBump();
          }}
          onBlur={() => {
            isTypingDescriptionRef.current = false;
            syncDescriptionToDraft(localDescriptionRef.current);
            flushPendingTextBump();
          }}
          placeholder="Describe the item — only include details you know are true"
          rows={4}
          aria-label="Listing description"
          autoComplete="off"
          enterKeyHint="done"
          className={cn(
            sellFieldClassName,
            focusRing,
            "min-h-[6rem] resize-none",
            fieldErrorClassName(Boolean(errors.description)),
          )}
        />
        <FieldError message={errors.description} />
      </div>

      <div className="flex flex-col gap-ds-1">
        <NavRow
          label="Category"
          value={categoryDisplay}
          placeholder="Select a category"
          hasError={Boolean(errors.category)}
          onClick={() => setCategoryOpen(true)}
          ariaLabel="Select category"
        />
        <FieldError message={errors.category} />
      </div>

      <div className="flex flex-col gap-ds-1">
        <label htmlFor={priceId} className="px-ds-1 text-xs font-medium text-text-muted">
          Price
        </label>
        <input
          id={priceId}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          aria-label="Price"
          placeholder="0.00"
          value={draft.price}
          onChange={(event) => {
            const sanitized = event.target.value.replace(/[^\d.]/g, "");
            updateDraft({ price: sanitized });
          }}
          className={cn(
            sellFieldClassName,
            focusRing,
            "min-h-ds-7 text-lg tabular-nums",
            fieldErrorClassName(Boolean(errors.price)),
          )}
        />
        <FieldError message={errors.price} />
      </div>

      {!directContact && (
        <div className="flex flex-col gap-ds-1">
          <NavRow
            label="Parcel size"
            value={parcelLabel}
            placeholder="Select a parcel size"
            hasError={Boolean(errors.parcelSize)}
            onClick={() => setParcelOpen(true)}
            ariaLabel="Select parcel size"
          />
          <FieldError message={errors.parcelSize} />
        </div>
      )}

      <CategorySelectScreen
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        onSelect={(path) => setCategoryPath(path)}
      />

      {!directContact && (
        <ParcelSizeScreen
          open={parcelOpen}
          value={draft.parcelSize}
          onClose={() => setParcelOpen(false)}
          onSelect={(size) => updateDraft({ parcelSize: size })}
        />
      )}
    </section>
  );
});
