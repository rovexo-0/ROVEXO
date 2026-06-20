"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import { toPathId } from "@/lib/categories/queries";
import type { CategoryMatchResult } from "@/lib/ai-camera/types";
import { getSellCurrencyConfig } from "@/lib/sell/currency";
import { CategoryMatchPicker } from "@/features/sell/components/CategoryMatchPicker";
import { CategoryTreePicker } from "@/features/sell/components/CategoryTreePicker";
import { InventoryQuantityField } from "@/features/sell/components/InventoryQuantityField";
import { SellInventoryFields } from "@/features/sell/components/SellInventoryFields";
import { SELL_CONDITIONS, isListingValid } from "@/features/sell/types";
import type { SellFormController } from "@/features/sell/hooks/use-sell-wizard";
import { focusRing } from "@/components/ui/tokens";

type SellListingFormProps = {
  form: SellFormController;
  manageInventory?: boolean;
};

const fieldClassName =
  "min-h-ds-7 w-full rounded-ds-sm border-0 bg-transparent px-0 py-0 text-sm text-text-primary placeholder:text-text-muted focus:outline-none";

function FormRow({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-ds-2 px-ds-4 py-ds-3", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SellListingForm({ form, manageInventory = false }: SellListingFormProps) {
  const { draft, updateDraft, setCategoryPath } = form;
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const analysis = draft.analysis;
  const currency = useMemo(() => getSellCurrencyConfig(), []);

  const handleMatchSelect = (match: CategoryMatchResult) => {
    setCategoryPath(match.path);
    setCategoryPickerOpen(false);
  };

  const categoryDisplay = draft.categoryPath?.pathLabel ?? "";

  return (
    <section aria-labelledby="sell-form-heading" className="flex flex-col gap-ds-4">
      <h2 id="sell-form-heading" className="sr-only">
        Listing details
      </h2>

      <div className="overflow-hidden rounded-ds-lg border border-border bg-surface shadow-ds-soft">
        <FormRow label="Title" htmlFor="sell-title">
          <input
            id="sell-title"
            type="text"
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            placeholder="Listing title"
            className={cn(fieldClassName, focusRing, "rounded-ds-sm px-ds-2 py-ds-2")}
          />
        </FormRow>

        <div className="border-t border-border">
          <FormRow label="Description" htmlFor="sell-description">
            <textarea
              id="sell-description"
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
              rows={4}
              placeholder="Describe your item"
              className={cn(fieldClassName, focusRing, "min-h-[6rem] resize-y rounded-ds-sm px-ds-2 py-ds-2")}
            />
          </FormRow>
        </div>

        <div className="border-t border-border">
          <FormRow label="Category">
            <button
              type="button"
              onClick={() => setCategoryPickerOpen((current) => !current)}
              className={cn(
                "min-h-ds-7 w-full rounded-ds-sm border border-border bg-surface-muted px-ds-3 py-ds-2 text-left text-sm text-text-primary",
                focusRing,
              )}
            >
              {categoryDisplay || "Select category"}
            </button>

            {analysis && !analysis.autoSelected && (
              <CategoryMatchPicker
                matches={analysis.matches}
                value={draft.categoryPath ? toPathId(draft.categoryPath) : null}
                onChange={handleMatchSelect}
              />
            )}

            {categoryPickerOpen && (
              <CategoryTreePicker
                value={draft.categoryPath ? toPathId(draft.categoryPath) : null}
                onChange={(path) => {
                  setCategoryPath(path);
                  setCategoryPickerOpen(false);
                }}
              />
            )}
          </FormRow>
        </div>

        <div className="border-t border-border">
          <FormRow label="Brand" htmlFor="sell-brand">
            <input
              id="sell-brand"
              type="text"
              value={draft.brand}
              onChange={(event) => updateDraft({ brand: event.target.value })}
              placeholder="Brand"
              className={cn(fieldClassName, focusRing, "rounded-ds-sm px-ds-2 py-ds-2")}
            />
          </FormRow>
        </div>

        <div className="border-t border-border">
          <FormRow label="Colour" htmlFor="sell-colour">
            <input
              id="sell-colour"
              type="text"
              value={draft.color}
              onChange={(event) => updateDraft({ color: event.target.value })}
              placeholder="Colour"
              className={cn(fieldClassName, focusRing, "rounded-ds-sm px-ds-2 py-ds-2")}
            />
          </FormRow>
        </div>

        <div className="border-t border-border">
          <FormRow label="Size" htmlFor="sell-size">
            <input
              id="sell-size"
              type="text"
              value={draft.size}
              onChange={(event) => updateDraft({ size: event.target.value })}
              placeholder="Size (if detected)"
              className={cn(fieldClassName, focusRing, "rounded-ds-sm px-ds-2 py-ds-2")}
            />
          </FormRow>
        </div>

        <div className="border-t border-border">
          <FormRow label="Condition">
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
          <FormRow label="Price" htmlFor="sell-price">
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
                className={cn(fieldClassName, focusRing, "rounded-ds-sm py-ds-2 pl-ds-5 pr-ds-2")}
              />
            </div>
          </FormRow>
        </div>

        <div className="border-t border-border px-ds-4 py-ds-3">
          <InventoryQuantityField
            id="sell-quantity"
            label="Available Quantity"
            value={draft.stock}
            onChange={(stock) => updateDraft({ stock })}
            helpText="How many of this item do you have?"
          />
        </div>

        {manageInventory && <SellInventoryFields form={form} />}

        <div className="border-t border-border">
          <label className="flex min-h-ds-7 cursor-pointer items-center gap-ds-3 px-ds-4 py-ds-3">
            <input
              type="checkbox"
              checked={draft.acceptOffers}
              onChange={(event) => updateDraft({ acceptOffers: event.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            <span className="text-sm font-medium text-text-primary">Accept Offers</span>
          </label>
        </div>
      </div>
    </section>
  );
}

export function useSellPublishState(form: SellFormController, manageInventory = false) {
  return (
    isListingValid(form.draft, { requireInventory: manageInventory }) && !form.isAnalyzing
  );
}
