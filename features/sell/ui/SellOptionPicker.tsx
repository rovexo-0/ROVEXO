"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel, focusRing } from "@/features/sell/ui/sell-classes";
import { SellPanelHeader } from "@/features/sell/ui/SellPrimitives";
import { CanonicalMenuRow, CanonicalButton } from "@/src/components/canonical";
import type { SelectionOption } from "@/lib/sell/attribute-options";

export type SellOptionPickerProps = {
  title: string;
  options: readonly SelectionOption[];
  mode: "single" | "multiple";
  layout?: "list" | "grid";
  searchable?: boolean;
  searchPlaceholder?: string;
  popularIds?: readonly string[];
  allowCustomFromSearch?: boolean;
  showSwatch?: boolean;
  value: readonly string[];
  suggestedSectionTitle?: string;
  suggestedOption?: SelectionOption | null;
  chooseAnotherLabel?: string;
  onClose: () => void;
  onDone: (selected: string[]) => void;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Fullscreen attribute selector.
 * Single: tap → auto-save → auto-return (no Done).
 * Multiple: tap to toggle → Apply → auto-return.
 */
export function SellOptionPicker({
  title,
  options,
  mode,
  layout = "list",
  searchable = false,
  searchPlaceholder = "Search",
  popularIds,
  allowCustomFromSearch = false,
  showSwatch = false,
  value,
  suggestedSectionTitle,
  suggestedOption,
  chooseAnotherLabel = "Choose another",
  onClose,
  onDone,
}: SellOptionPickerProps) {
  const [query, setQuery] = useState("");
  const [draftSelection, setDraftSelection] = useState<string[]>(() => [...value]);

  const allOptions = useMemo<SelectionOption[]>(() => {
    const known = new Set(options.map((option) => option.id));
    const extras = value.filter((id) => !known.has(id)).map((id) => ({ id, label: id }));
    return [...extras, ...options];
  }, [options, value]);

  const trimmed = query.trim();
  const filtered = useMemo(() => {
    if (!trimmed) return allOptions;
    const q = normalize(trimmed);
    return allOptions.filter((option) => normalize(option.label).includes(q));
  }, [allOptions, trimmed]);

  const showCustom =
    allowCustomFromSearch &&
    trimmed.length > 0 &&
    !allOptions.some((option) => normalize(option.label) === normalize(trimmed));

  const popularOptions = useMemo(() => {
    if (!popularIds || trimmed) return [];
    const set = new Set(popularIds);
    return allOptions.filter((option) => set.has(option.id));
  }, [allOptions, popularIds, trimmed]);

  const selectSingle = (id: string) => {
    onDone([id]);
    onClose();
  };

  const toggleMulti = (id: string) => {
    setDraftSelection((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const applyMulti = () => {
    onDone(draftSelection);
    onClose();
  };

  const useSwatchGrid = showSwatch && layout !== "grid";
  const activeIds = mode === "multiple" ? draftSelection : value;

  const renderSwatchCell = (option: SelectionOption) => {
    const active = activeIds.includes(option.id) || activeIds.includes(option.label);
    return (
      <button
        key={option.id}
        type="button"
        role={mode === "multiple" ? "checkbox" : "radio"}
        aria-checked={active}
        aria-label={option.label}
        onClick={() => (mode === "multiple" ? toggleMulti(option.id) : selectSingle(option.id))}
        className={cn(
          "flex min-h-[44px] w-full items-center gap-ds-2 rounded-ds-md px-ds-2 py-ds-1 text-left transition-colors",
          active ? "bg-primary/5" : "bg-transparent",
          focusRing,
        )}
      >
        <span
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded-ds-full border-2",
            active ? "border-primary" : "border-border",
          )}
          aria-hidden
        >
          {active ? <span className="h-2.5 w-2.5 rounded-ds-full bg-primary" /> : null}
        </span>
        {option.swatch ? (
          <span
            className="h-5 w-5 shrink-0 rounded-ds-full border border-border"
            style={{ backgroundColor: option.swatch }}
            aria-hidden
          />
        ) : null}
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium",
            active ? "text-primary" : "text-text-primary",
          )}
        >
          {option.label}
        </span>
      </button>
    );
  };

  const renderRow = (option: SelectionOption) => {
    const active = activeIds.includes(option.id) || activeIds.includes(option.label);
    return (
      <li key={option.id}>
        <CanonicalMenuRow
          title={option.label}
          icon={
            showSwatch ? (
              <span
                className="h-6 w-6 shrink-0 rounded-ds-full border border-border"
                style={{ backgroundColor: option.swatch ?? "transparent" }}
                aria-hidden
              />
            ) : undefined
          }
          value={active ? "Selected" : undefined}
          onClick={() => (mode === "multiple" ? toggleMulti(option.id) : selectSingle(option.id))}
          hideChevron
        />
      </li>
    );
  };

  const renderGridCell = (option: SelectionOption) => {
    const active = activeIds.includes(option.id) || activeIds.includes(option.label);
    return (
      <button
        key={option.id}
        type="button"
        role={mode === "multiple" ? "checkbox" : "radio"}
        aria-checked={active}
        onClick={() => (mode === "multiple" ? toggleMulti(option.id) : selectSingle(option.id))}
        className={cn(
          "grid min-h-[44px] place-items-center rounded-ds-md border-2 px-ds-2 text-center text-base font-semibold transition-colors",
          active
            ? "border-primary bg-primary/5 text-primary"
            : "border-border bg-surface-muted/40 text-text-primary",
          focusRing,
        )}
      >
        {option.label}
      </button>
    );
  };

  return (
    <ModalContainer open onClose={onClose} variant="fullscreen" zIndex={200} ariaLabel={title} lockScroll={false}>
      <div className={cn(sellPanel, "flex min-h-0 flex-1 flex-col")}>
        <SellPanelHeader title={title} onBack={onClose} />

        {searchable ? (
          <div className="shrink-0 border-b border-border px-0 py-2">
            <label className="sr-only" htmlFor={`sell-option-search-${title}`}>
              {searchPlaceholder}
            </label>
            <input
              id={`sell-option-search-${title}`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoComplete="off"
              className={cn("cds-input w-full", focusRing)}
            />
          </div>
        ) : null}

        <div className={cn(RX_MODAL_BODY, "min-h-0 flex-1 overflow-y-auto overscroll-contain pt-2")}>
          {suggestedOption && !trimmed && mode === "single" ? (
            <>
              <p className="px-ds-1 pb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {suggestedSectionTitle ?? `Suggested ${title}`}
              </p>
              <ul className="mb-ds-4 flex flex-col gap-ds-2" role="list">
                {renderRow(suggestedOption)}
              </ul>
              <div className="mb-ds-3 border-t border-border" role="separator" aria-hidden />
              <p className="px-ds-1 pb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {chooseAnotherLabel}
              </p>
            </>
          ) : null}

          {useSwatchGrid ? (
            <div
              className="grid grid-cols-2 gap-ds-1 pb-ds-4"
              role={mode === "multiple" ? "group" : "radiogroup"}
              aria-label={title}
            >
              {filtered.map(renderSwatchCell)}
            </div>
          ) : layout === "grid" ? (
            <div
              className="grid grid-cols-3 gap-ds-2 pb-ds-4"
              role={mode === "multiple" ? "group" : "radiogroup"}
              aria-label={title}
            >
              {filtered.map(renderGridCell)}
            </div>
          ) : (
            <>
              {showCustom ? (
                <ul className="mb-ds-3 flex flex-col gap-ds-2">
                  {renderRow({ id: trimmed, label: `Use “${trimmed}”` })}
                </ul>
              ) : null}

              {popularOptions.length > 0 ? (
                <>
                  <p className="px-ds-1 pb-ds-2 pt-ds-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Popular
                  </p>
                  <ul className="mb-ds-3 flex flex-col gap-ds-2" role="list" aria-label={`Popular ${title}`}>
                    {popularOptions.map(renderRow)}
                  </ul>
                  <p className="px-ds-1 pb-ds-2 pt-ds-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    All
                  </p>
                </>
              ) : null}

              <ul className="flex flex-col gap-ds-2 pb-ds-4" role="list" aria-label={title}>
                {filtered.map(renderRow)}
              </ul>

              {filtered.length === 0 && !showCustom ? (
                <p className="px-ds-1 py-ds-6 text-center text-sm text-text-secondary">No matches found.</p>
              ) : null}
            </>
          )}
        </div>

        {mode === "multiple" ? (
          <div className="shrink-0 border-t border-border px-0 py-2">
            <CanonicalButton fullWidth onClick={applyMulti}>
              Apply
            </CanonicalButton>
          </div>
        ) : null}
      </div>
    </ModalContainer>
  );
}
