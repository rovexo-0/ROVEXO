"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import { toPathId } from "@/lib/categories/queries";
import { getSellCurrencyConfig } from "@/lib/sell/currency";
import { ListingTitleField } from "@/features/sell/components/ListingTitleField";
import { CategoryTreePicker } from "@/features/sell/components/CategoryTreePicker";
import { AiCategoryDetection } from "@/features/sell/components/TitleCategorySuggestions";
import { FieldError, fieldErrorClassName } from "@/features/sell/components/FieldError";
import { InventoryQuantityField } from "@/features/sell/components/InventoryQuantityField";
import { SellLocationField } from "@/features/sell/components/SellLocationField";
import {
  SELL_CONDITIONS,
  getListingValidationErrors,
  isListingValid,
  type ListingValidationOptions,
} from "@/features/sell/types";
import type { SellFormController } from "@/features/sell/hooks/use-sell-wizard";
import { sellBackgroundPolicy } from "@/lib/sell/sell-background-policy";
import { focusRing } from "@/components/ui/tokens";

type SellListingFormProps = {
  form: SellFormController;
};

const fieldClassName =
  "min-h-ds-7 w-full rounded-ds-sm border-0 bg-transparent px-0 py-0 text-sm text-text-primary placeholder:text-text-muted focus:outline-none";

function FormRow({
  label,
  htmlFor,
  children,
  error,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-ds-2 px-ds-4 py-ds-3", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function SellListingForm({ form }: SellListingFormProps) {
  const {
    draft,
    updateDraft,
    syncTitleAfterIdle,
    flushTitleCommitRef,
    pendingTitleRef,
    showValidation,
    setCategoryPath,
    categoryDetection,
    categoryDetectionDismissed,
    confirmSuggestedCategory,
    dismissCategoryDetection,
    openCategoryPickerForChange,
    listingMode,
  } = form;
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const currency = useMemo(() => getSellCurrencyConfig(), []);
  const errors = getListingValidationErrors(draft, { mode: listingMode, showErrors: showValidation });

  const categoryDisplay = draft.categoryPath?.pathLabel ?? "";

  return (
    <section aria-labelledby="sell-form-heading" className="flex flex-col gap-ds-4">
      <h2 id="sell-form-heading" className="sr-only">
        Listing details
      </h2>

      <div className="rx-form-section overflow-hidden">
        <SellLocationField
          form={form}
          error={errors.location}
          disableAutoDetect={!sellBackgroundPolicy.autoLocationEnabled}
        />

        <FormRow label="Title" htmlFor="sell-title" className="border-t border-border">
          <ListingTitleField
            id="sell-title"
            externalTitle={draft.title}
            showValidation={showValidation}
            className={cn(
              fieldClassName,
              focusRing,
              "rounded-ds-sm px-ds-2 py-ds-2",
            )}
            onIdleCommit={syncTitleAfterIdle}
            pendingTitleRef={pendingTitleRef}
            flushIdleCommit={flushTitleCommitRef}
          />
        </FormRow>

        <div className="border-t border-border">
          <FormRow label="Description" htmlFor="sell-description" error={errors.description}>
            <textarea
              id="sell-description"
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
              rows={4}
              placeholder="Describe your item using only what you know about it"
              className={cn(
                fieldClassName,
                focusRing,
                fieldErrorClassName(Boolean(errors.description)),
                "min-h-[6rem] resize-y rounded-ds-sm px-ds-2 py-ds-2",
              )}
            />
          </FormRow>
        </div>

        <div className="border-t border-border">
          <FormRow label="Category" error={errors.category}>
            <button
              type="button"
              onClick={() => setCategoryPickerOpen((current) => !current)}
              className={cn(
                "rx-input min-h-ds-7 w-full rounded-ds-sm bg-surface-muted/60 px-ds-3 py-ds-2 text-left text-sm",
                fieldErrorClassName(Boolean(errors.category)),
                focusRing,
              )}
            >
              {categoryDisplay || "Select category"}
            </button>

            {categoryPickerOpen && (
              <CategoryTreePicker
                value={draft.categoryPath ? toPathId(draft.categoryPath) : null}
                onChange={(path) => {
                  setCategoryPath(path);
                  setCategoryPickerOpen(false);
                }}
              />
            )}

            {sellBackgroundPolicy.categorySuggestEnabled ? (
              <AiCategoryDetection
                detection={categoryDetection}
                dismissed={categoryDetectionDismissed}
                selectedPath={draft.categoryPath}
                onConfirm={confirmSuggestedCategory}
                onChange={() => {
                  openCategoryPickerForChange();
                  setCategoryPickerOpen(true);
                }}
                onDismiss={dismissCategoryDetection}
                onSelect={setCategoryPath}
              />
            ) : null}
          </FormRow>
        </div>

        <div className="border-t border-border">
          <FormRow label="Brand (optional)" htmlFor="sell-brand">
            <input
              id="sell-brand"
              type="text"
              value={draft.brand}
              onChange={(event) => updateDraft({ brand: event.target.value })}
              placeholder="Leave blank if unknown"
              className={cn(fieldClassName, focusRing, "rounded-ds-sm px-ds-2 py-ds-2")}
            />
          </FormRow>
        </div>

        <div className="border-t border-border grid gap-0 sm:grid-cols-2">
          <FormRow label="Colour (optional)" htmlFor="sell-colour" className="sm:border-r sm:border-border">
            <input
              id="sell-colour"
              type="text"
              value={draft.color}
              onChange={(event) => updateDraft({ color: event.target.value })}
              placeholder="Colour"
              className={cn(fieldClassName, focusRing, "rounded-ds-sm px-ds-2 py-ds-2")}
            />
          </FormRow>

          <FormRow label="Size (optional)" htmlFor="sell-size">
            <input
              id="sell-size"
              type="text"
              value={draft.size}
              onChange={(event) => updateDraft({ size: event.target.value })}
              placeholder="e.g. UK 9"
              className={cn(fieldClassName, focusRing, "rounded-ds-sm px-ds-2 py-ds-2")}
            />
          </FormRow>
        </div>

        <div className="border-t border-border">
          <FormRow label="Condition" error={errors.condition}>
            <div className="flex flex-wrap gap-ds-2">
              {SELL_CONDITIONS.map((condition) => (
                <CategoryChip
                  key={condition}
                  label={condition}
                  active={draft.condition === condition}
                  onClick={() => updateDraft({ condition })}
                />
              ))}
            </div>
          </FormRow>
        </div>

        <div className="border-t border-border">
          <FormRow label="Price" htmlFor="sell-price" error={errors.price}>
            <div className="relative">
              <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-secondary">
                {currency.symbol}
              </span>
              <input
                id="sell-price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={draft.price}
                onChange={(event) => updateDraft({ price: event.target.value })}
                placeholder="0.00"
                className={cn(
                  fieldClassName,
                  focusRing,
                  fieldErrorClassName(Boolean(errors.price)),
                  "rounded-ds-sm py-ds-2 pl-ds-5 pr-ds-2",
                )}
              />
            </div>
          </FormRow>
        </div>

        <div className="border-t border-border px-ds-4 py-ds-3">
          <InventoryQuantityField
            id="sell-quantity"
            label="Available quantity"
            value={draft.stock}
            onChange={(stock) => updateDraft({ stock })}
            helpText="How many of this item do you have?"
          />
          <FieldError message={errors.stock} />
        </div>

        <div className="border-t border-border">
          <label className="flex min-h-ds-7 cursor-pointer items-center gap-ds-3 px-ds-4 py-ds-3">
            <input
              type="checkbox"
              checked={draft.acceptOffers}
              onChange={(event) => updateDraft({ acceptOffers: event.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            <span className="text-sm font-medium text-text-primary">Accept offers</span>
          </label>
        </div>
      </div>
    </section>
  );
}

export function useSellPublishState(
  form: SellFormController,
  options: ListingValidationOptions = {},
) {
  return isListingValid(form.draft, { mode: form.listingMode, ...options });
}
