"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { toPathId } from "@/lib/categories/queries";
import { focusRing } from "@/components/ui/tokens";
import { bumpPendingTextVersion } from "@/lib/sell/pending-text-store";
import { sellInputDiag } from "@/lib/sell/sell-input-diagnostics";
import { sellProfileBumpPending, sellProfileRender } from "@/lib/sell/sell-profiler";
import { getSellCurrencyConfig } from "@/lib/sell/currency";
import { clampInventory, INVENTORY_MAX, INVENTORY_MIN } from "@/lib/sell/inventory";
import {
  clampListingTitle,
  LISTING_TITLE_MAX,
  validateListingTitle,
} from "@/lib/sell/listing-title";
import { CategoryTreePicker } from "@/features/sell/components/CategoryTreePicker";
import { FieldError, fieldErrorClassName } from "@/features/sell/components/FieldError";
import {
  sellDeliveryCardClassName,
  sellFieldClassName,
  sellFormCardClassName,
} from "@/features/sell/components/sell-ui";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors } from "@/features/sell/types";

type DeliveryChoice = "collection_only" | "delivery_available" | "free_delivery";

const DELIVERY_OPTIONS: { id: DeliveryChoice; label: string }[] = [
  { id: "collection_only", label: "Collection Only" },
  { id: "delivery_available", label: "Delivery Available" },
  { id: "free_delivery", label: "Free Delivery" },
];

function resolveDeliveryChoice(
  shippingMethod: string,
  freeDelivery: boolean,
): DeliveryChoice {
  if (freeDelivery) return "free_delivery";
  if (shippingMethod === "collection_only") return "collection_only";
  return "delivery_available";
}

const PENDING_TEXT_BUMP_MS = 300;

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
    scheduleCategoryDetection,
    categorySuggestion,
    acceptCategorySuggestion,
    dismissCategorySuggestion,
  } = useSell();

  const titleId = useId();
  const descriptionId = useId();
  const categoryId = useId();
  const quantityId = useId();
  const priceId = useId();

  const currency = useMemo(() => getSellCurrencyConfig(), []);
  const [localTitle, setLocalTitle] = useState(draft.title);
  const [localDescription, setLocalDescription] = useState(draft.description);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const localTitleRef = useRef(localTitle);
  const localDescriptionRef = useRef(localDescription);
  const isTypingTitleRef = useRef(false);
  const isTypingDescriptionRef = useRef(false);
  const pendingBumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  localTitleRef.current = localTitle;
  localDescriptionRef.current = localDescription;

  const errors = useMemo(
    () => getListingValidationErrors(draft, { mode: "quick", showErrors: showValidation }),
    [draft, showValidation],
  );

  useEffect(() => {
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
    sellInputDiag("description.externalSync", {
      fromLen: localDescriptionRef.current.length,
      toLen: draft.description.length,
    });
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

  const deliveryChoice = resolveDeliveryChoice(draft.shippingMethod, draft.freeDelivery);

  const setDeliveryChoice = (choice: DeliveryChoice) => {
    if (choice === "collection_only") {
      updateDraft({ shippingMethod: "collection_only", freeDelivery: false });
      return;
    }
    if (choice === "free_delivery") {
      updateDraft({ shippingMethod: "delivery_available", freeDelivery: true });
      return;
    }
    updateDraft({ shippingMethod: "delivery_available", freeDelivery: false });
  };

  const adjustQuantity = (delta: number) => {
    updateDraft({ stock: clampInventory(draft.stock + delta) });
  };

  const categoryDisplay = draft.categoryPath?.pathLabel ?? "";

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
            // Detection runs once the user pauses typing (debounced in the
            // provider) and entirely inside the Web Worker — never per keystroke.
            scheduleCategoryDetection();
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
            sellInputDiag("description.onChange", { len: next.length });
            schedulePendingTextBump();
          }}
          onFocus={() => {
            sellInputDiag("description.onFocus");
          }}
          onBlur={() => {
            isTypingDescriptionRef.current = false;
            sellInputDiag("description.onBlur", { len: localDescriptionRef.current.length });
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

      <div className="flex flex-col gap-ds-2">
        <button
          id={categoryId}
          type="button"
          onClick={() => setCategoryPickerOpen((current) => !current)}
          aria-label="Select category"
          aria-expanded={categoryPickerOpen}
          className={cn(
            sellFieldClassName,
            "min-h-ds-7 bg-surface-muted/60 text-left",
            fieldErrorClassName(Boolean(errors.category)),
            focusRing,
          )}
        >
          {categoryDisplay || "Select category"}
        </button>
        <FieldError message={errors.category} />

        {categorySuggestion && !categoryPickerOpen ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col gap-ds-2 rounded-ds-md border border-primary/40 bg-primary/5 p-ds-3"
          >
            <div className="flex items-center justify-between gap-ds-2">
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-medium text-text-muted">Suggested category</span>
                <span className="truncate text-sm font-semibold text-text-primary">
                  {categorySuggestion.label}
                </span>
              </div>
              <span className="shrink-0 rounded-ds-sm bg-surface px-ds-2 py-ds-1 text-xs font-semibold tabular-nums text-primary">
                {Math.round(categorySuggestion.confidence * 100)}%
              </span>
            </div>
            <div className="flex gap-ds-2">
              <button
                type="button"
                onClick={acceptCategorySuggestion}
                className={cn(
                  "min-h-ds-7 flex-1 rounded-ds-md border border-primary bg-primary/10 px-ds-3 text-sm font-semibold text-primary",
                  focusRing,
                )}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => {
                  dismissCategorySuggestion();
                  setCategoryPickerOpen(true);
                }}
                className={cn(
                  "min-h-ds-7 flex-1 rounded-ds-md border border-border bg-surface px-ds-3 text-sm font-semibold text-text-primary",
                  focusRing,
                )}
              >
                Change
              </button>
            </div>
          </div>
        ) : null}

        {categoryPickerOpen ? (
          <CategoryTreePicker
            hideLabels
            value={draft.categoryPath ? toPathId(draft.categoryPath) : null}
            onChange={(path) => {
              setCategoryPath(path);
              setCategoryPickerOpen(false);
            }}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-ds-1">
        <div className="flex items-center gap-ds-2">
          <IconButton
            label="Decrease quantity"
            variant="outline"
            size="md"
            className="min-h-ds-7 min-w-ds-7 shrink-0 rounded-ds-md"
            disabled={draft.stock <= INVENTORY_MIN}
            onClick={() => adjustQuantity(-1)}
          >
            <span className="text-lg font-semibold leading-none" aria-hidden>
              −
            </span>
          </IconButton>

          <input
            id={quantityId}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            role="spinbutton"
            aria-label="Quantity"
            placeholder="Quantity"
            value={String(draft.stock)}
            onChange={(event) => {
              const next = event.target.value.replace(/\D/g, "");
              updateDraft({ stock: next ? clampInventory(Number(next)) : draft.stock });
            }}
            className={cn(
              sellFieldClassName,
              focusRing,
              "text-center tabular-nums",
              fieldErrorClassName(Boolean(errors.stock)),
            )}
            aria-valuemin={INVENTORY_MIN}
            aria-valuemax={INVENTORY_MAX}
            aria-valuenow={draft.stock}
          />

          <IconButton
            label="Increase quantity"
            variant="outline"
            size="md"
            className="min-h-ds-7 min-w-ds-7 shrink-0 rounded-ds-md"
            disabled={draft.stock >= INVENTORY_MAX}
            onClick={() => adjustQuantity(1)}
          >
            <span className="text-lg font-semibold leading-none" aria-hidden>
              +
            </span>
          </IconButton>
        </div>
        <FieldError message={errors.stock} />
      </div>

      <div className="flex flex-col gap-ds-1">
        <div className="flex items-center gap-ds-2">
          <span
            className="flex min-h-ds-7 shrink-0 items-center px-ds-2 text-lg font-semibold text-text-primary tabular-nums"
            aria-hidden
          >
            {currency.symbol}
          </span>
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
              "min-h-ds-7 flex-1 text-lg tabular-nums",
              fieldErrorClassName(Boolean(errors.price)),
            )}
          />
        </div>
        <FieldError message={errors.price} />
      </div>

      <div className="flex flex-col gap-ds-2" role="radiogroup" aria-label="Delivery options">
        {DELIVERY_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={deliveryChoice === option.id}
            onClick={() => setDeliveryChoice(option.id)}
            className={sellDeliveryCardClassName(deliveryChoice === option.id)}
          >
            <span className="block text-sm font-semibold text-text-primary">{option.label}</span>
          </button>
        ))}
        <FieldError message={errors.shippingMethod} />
      </div>
    </section>
  );
});
