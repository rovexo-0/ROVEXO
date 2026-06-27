"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import { toPathId } from "@/lib/categories/queries";
import { getSellCurrencyConfig } from "@/lib/sell/currency";
import { SHIPPING_METHODS } from "@/lib/shipping/carriers";
import { CategoryTreePicker } from "@/features/sell/components/CategoryTreePicker";
import { AiCategoryDetection } from "@/features/sell/components/TitleCategorySuggestions";
import { FieldError, fieldErrorClassName } from "@/features/sell/components/FieldError";
import { InventoryQuantityField } from "@/features/sell/components/InventoryQuantityField";
import { SellLocationField } from "@/features/sell/components/SellLocationField";
import { getListingValidationErrors, SELL_CONDITIONS } from "@/features/sell/types";
import type { SellFormController } from "@/features/sell/hooks/use-sell-wizard";
import { focusRing } from "@/components/ui/tokens";

type SellQuickListingFormProps = {
  form: SellFormController;
};

const fieldClassName =
  "rx-input min-h-ds-7 w-full rounded-ds-sm px-ds-3 py-ds-2 text-sm placeholder:text-text-muted";

function FormRow({
  label,
  htmlFor,
  children,
  hint,
  error,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-ds-2 px-ds-4 py-ds-3", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      {hint ? <p className="text-xs text-text-secondary">{hint}</p> : null}
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function SellQuickListingForm({ form }: SellQuickListingFormProps) {
  const {
    draft,
    updateDraft,
    setCategoryPath,
    categoryDetection,
    categoryDetectionDismissed,
    confirmSuggestedCategory,
    dismissCategoryDetection,
    openCategoryPickerForChange,
    listingMode,
  } = form;
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const currency = useMemo(() => getSellCurrencyConfig(), []);
  const errors = getListingValidationErrors(draft, { mode: listingMode });

  const categoryDisplay = draft.categoryPath?.pathLabel ?? "";

  return (
    <section aria-labelledby="sell-quick-form-heading" className="flex flex-col gap-ds-3">
      <div>
        <h2 id="sell-quick-form-heading" className="text-base font-semibold text-text-primary">
          Quick listing
        </h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Add photos, describe your item, set a price, and publish.
        </p>
      </div>

      <div className="rx-form-section overflow-hidden">
        <SellLocationField form={form} error={errors.location} />

        <FormRow label="Title" htmlFor="sell-quick-title" error={errors.title} className="border-t border-border">
          <input
            id="sell-quick-title"
            type="text"
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            placeholder="What are you selling?"
            maxLength={80}
            className={cn(fieldClassName, focusRing, fieldErrorClassName(Boolean(errors.title)))}
            autoComplete="off"
          />
        </FormRow>

        <div className="border-t border-border">
          <FormRow
            label="Description"
            htmlFor="sell-quick-description"
            error={errors.description}
          >
            <textarea
              id="sell-quick-description"
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
              rows={3}
              placeholder="Describe the item — only include details you know are true"
              className={cn(
                fieldClassName,
                focusRing,
                fieldErrorClassName(Boolean(errors.description)),
                "min-h-[5rem] resize-y",
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
          <FormRow label="Price" htmlFor="sell-quick-price" error={errors.price}>
            <div className="relative">
              <span className="pointer-events-none absolute left-ds-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-secondary">
                {currency.symbol}
              </span>
              <input
                id="sell-quick-price"
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
                  "pl-ds-8",
                )}
              />
            </div>
          </FormRow>
        </div>

        <div className="border-t border-border px-ds-4 py-ds-3">
          <InventoryQuantityField
            id="sell-quick-quantity"
            label="Available quantity"
            value={draft.stock}
            onChange={(stock) => updateDraft({ stock })}
            helpText="How many can you sell?"
          />
          <FieldError message={errors.stock} />
        </div>

        <div className="border-t border-border">
          <FormRow label="Delivery" error={errors.shippingMethod}>
            <div className="flex flex-col gap-ds-2">
              {SHIPPING_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => updateDraft({ shippingMethod: method.id })}
                  className={cn(
                    "rounded-ds-md border px-ds-3 py-ds-2 text-left transition-colors",
                    draft.shippingMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface",
                    focusRing,
                  )}
                >
                  <span className="block text-sm font-semibold text-text-primary">{method.label}</span>
                  <span className="mt-ds-0.5 block text-xs text-text-secondary">{method.description}</span>
                </button>
              ))}
            </div>
          </FormRow>
        </div>
      </div>

      <div className="rx-form-section overflow-hidden">
        <button
          type="button"
          onClick={() => setMoreDetailsOpen((open) => !open)}
          className={cn(
            "flex min-h-ds-7 w-full items-center justify-between px-ds-4 py-ds-3 text-left",
            focusRing,
          )}
          aria-expanded={moreDetailsOpen}
        >
          <span className="text-sm font-semibold text-text-primary">More details</span>
          <span className="text-xs text-text-secondary">Optional</span>
        </button>

        {moreDetailsOpen ? (
          <div className="border-t border-border">
            <FormRow label="Brand" htmlFor="sell-quick-brand">
              <input
                id="sell-quick-brand"
                type="text"
                value={draft.brand}
                onChange={(event) => updateDraft({ brand: event.target.value })}
                placeholder="Brand (optional)"
                className={cn(fieldClassName, focusRing)}
              />
            </FormRow>

            <div className="border-t border-border grid gap-0 sm:grid-cols-2">
              <FormRow label="Colour" htmlFor="sell-quick-colour" className="sm:border-r sm:border-border">
                <input
                  id="sell-quick-colour"
                  type="text"
                  value={draft.color}
                  onChange={(event) => updateDraft({ color: event.target.value })}
                  placeholder="Colour (optional)"
                  className={cn(fieldClassName, focusRing)}
                />
              </FormRow>

              <FormRow label="Size" htmlFor="sell-quick-size">
                <input
                  id="sell-quick-size"
                  type="text"
                  value={draft.size}
                  onChange={(event) => updateDraft({ size: event.target.value })}
                  placeholder="Size (optional)"
                  className={cn(fieldClassName, focusRing)}
                />
              </FormRow>
            </div>

            <div className="border-t border-border">
              <FormRow label="Material" htmlFor="sell-quick-material">
                <input
                  id="sell-quick-material"
                  type="text"
                  value={draft.material}
                  onChange={(event) => updateDraft({ material: event.target.value })}
                  placeholder="Material (optional)"
                  className={cn(fieldClassName, focusRing)}
                />
              </FormRow>
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
        ) : null}
      </div>
    </section>
  );
}
