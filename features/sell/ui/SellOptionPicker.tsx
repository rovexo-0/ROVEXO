"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel, focusRing } from "@/features/sell/ui/sell-classes";
import { SellPanelHeader } from "@/features/sell/ui/SellPrimitives";
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5 text-text-muted" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z" />
    </svg>
  );
}

/**
 * Fullscreen attribute selector — tap to select, auto-close, return to sell form.
 * No Done / Apply / Save buttons. Scroll body is independent per page.
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

  const select = (id: string) => {
    onDone(mode === "multiple" ? [id] : [id]);
    onClose();
  };

  const useSwatchGrid = showSwatch && layout !== "grid";

  const renderSwatchCell = (option: SelectionOption) => {
    const active = value.includes(option.id);
    return (
      <button
        key={option.id}
        type="button"
        role="radio"
        aria-checked={active}
        aria-label={option.label}
        onClick={() => select(option.id)}
        className={cn(
          "flex flex-col items-center gap-ds-2 rounded-ds-md p-ds-2 transition-colors",
          active ? "bg-primary/5" : "bg-transparent",
          focusRing,
        )}
      >
        <span
          className={cn(
            "h-12 w-12 shrink-0 rounded-ds-full border-2 shadow-sm",
            active ? "border-primary ring-2 ring-primary/30" : "border-border",
          )}
          style={{ backgroundColor: option.swatch ?? "transparent" }}
          aria-hidden
        />
        <span className={cn(
          "max-w-full truncate text-center text-xs font-medium",
          active ? "text-primary" : "text-text-secondary",
        )}>
          {option.label}
        </span>
      </button>
    );
  };

  const renderRow = (option: SelectionOption) => {
    const active = value.includes(option.id);
    return (
      <li key={option.id}>
        <button
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => select(option.id)}
          className={cn(
            "flex min-h-[56px] w-full items-center gap-ds-3 rounded-ds-md border-2 px-ds-4 text-left transition-colors",
            active ? "border-primary bg-primary/5" : "border-border bg-surface-muted/40",
            focusRing,
          )}
        >
          {showSwatch ? (
            <span className="h-6 w-6 shrink-0 rounded-ds-full border border-border" style={{ backgroundColor: option.swatch ?? "transparent" }} aria-hidden />
          ) : null}
          <span className="min-w-0 flex-1 truncate text-base font-medium text-text-primary">{option.label}</span>
          <span
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center rounded-ds-full border-2",
              active ? "border-primary bg-primary text-white" : "border-border",
            )}
            aria-hidden
          >
            {active ? <span className="h-2.5 w-2.5 rounded-ds-full bg-white" /> : null}
          </span>
        </button>
      </li>
    );
  };

  const renderGridCell = (option: SelectionOption) => {
    const active = value.includes(option.id);
    return (
      <button
        key={option.id}
        type="button"
        role="radio"
        aria-checked={active}
        onClick={() => select(option.id)}
        className={cn(
          "grid min-h-[56px] place-items-center rounded-ds-md border-2 px-ds-2 text-center text-base font-semibold transition-colors",
          active ? "border-primary bg-primary/5 text-primary" : "border-border bg-surface-muted/40 text-text-primary",
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
          <div className="shrink-0 border-b border-border px-ds-4 py-ds-3">
            <div className={cn("flex items-center gap-ds-2 rounded-ds-md bg-surface-muted px-ds-3", focusRing)}>
              <SearchIcon />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                autoComplete="off"
                className="h-11 w-full flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
          </div>
        ) : null}

        <div className={cn(RX_MODAL_BODY, "min-h-0 flex-1 overflow-y-auto overscroll-contain px-ds-4 pt-ds-3")}>
          {suggestedOption && !trimmed ? (
            <>
              <p className="px-ds-1 pb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {suggestedSectionTitle ?? `Suggested ${title}`}
              </p>
              <ul className="mb-ds-4 flex flex-col gap-ds-2" role="list">
                {renderRow(suggestedOption)}
              </ul>
              <div className="mb-ds-3 border-t border-border" role="separator" aria-hidden />
              <p className="px-ds-1 pb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{chooseAnotherLabel}</p>
            </>
          ) : null}

          {useSwatchGrid ? (
            <div className="grid grid-cols-4 gap-ds-2 pb-ds-4 sm:grid-cols-5" role="radiogroup" aria-label={title}>
              {filtered.map(renderSwatchCell)}
            </div>
          ) : layout === "grid" ? (
            <div className="grid grid-cols-3 gap-ds-2 pb-ds-4" role="radiogroup" aria-label={title}>
              {filtered.map(renderGridCell)}
            </div>
          ) : (
            <>
              {showCustom ? (
                <ul className="mb-ds-3 flex flex-col gap-ds-2">{renderRow({ id: trimmed, label: `Use “${trimmed}”` })}</ul>
              ) : null}

              {popularOptions.length > 0 ? (
                <>
                  <p className="px-ds-1 pb-ds-2 pt-ds-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Popular</p>
                  <ul className="mb-ds-3 flex flex-col gap-ds-2" role="radiogroup" aria-label={`Popular ${title}`}>
                    {popularOptions.map(renderRow)}
                  </ul>
                  <p className="px-ds-1 pb-ds-2 pt-ds-1 text-xs font-semibold uppercase tracking-wide text-text-muted">All</p>
                </>
              ) : null}

              <ul className="flex flex-col gap-ds-2 pb-ds-4" role="radiogroup" aria-label={title}>
                {filtered.map(renderRow)}
              </ul>

              {filtered.length === 0 && !showCustom ? (
                <p className="px-ds-1 py-ds-6 text-center text-sm text-text-secondary">No matches found.</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </ModalContainer>
  );
}
