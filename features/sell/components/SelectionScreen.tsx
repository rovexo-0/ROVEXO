"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { Button } from "@/components/ui/Button";
import styles from "@/features/sell/components/SelectionScreen.module.css";

export type SelectionOption = {
  id: string;
  label: string;
  /** Optional hex colour for a swatch (colour attribute). */
  swatch?: string;
};

export type SelectionScreenProps = {
  title: string;
  options: readonly SelectionOption[];
  mode: "single" | "multiple";
  layout?: "list" | "grid";
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Currently-selected option ids. */
  value: readonly string[];
  onClose: () => void;
  onDone: (selected: string[]) => void;
  /** Render colour swatches alongside labels. */
  showSwatch?: boolean;
  /** Option ids to feature under a "Popular" heading (list layout, no active search). */
  popularIds?: readonly string[];
  /** When searching yields no exact match, offer the raw query as a custom option. */
  allowCustomFromSearch?: boolean;
  doneLabel?: string;
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-text-muted" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={3} stroke="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * ROVEXO Universal Selection Engine.
 *
 * One reusable full-screen selector for every listing attribute (Brand, Size,
 * Colour, Material and future attributes). Configuration-driven — single vs.
 * multiple selection, list vs. grid layout, optional search, optional colour
 * swatches, a "Popular" section and free-text custom entries are all props.
 * Returns the selected ids via `onDone`; nothing about the draft, publish,
 * validation or backend flow lives here.
 *
 * Mount it only while presented (e.g. `{open ? <SelectionScreen … /> : null}`);
 * the working selection is seeded from `value` on mount, avoiding effect-driven
 * state resets.
 */
export function SelectionScreen({
  title,
  options,
  mode,
  layout = "list",
  searchable = false,
  searchPlaceholder = "Search",
  value,
  onClose,
  onDone,
  showSwatch = false,
  popularIds,
  allowCustomFromSearch = false,
  doneLabel = "Done",
}: SelectionScreenProps) {
  const [selected, setSelected] = useState<string[]>(() => [...value]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Surface any currently-selected values that are not part of the option set
  // (e.g. a previously-saved custom brand) so they still render as selected.
  const allOptions = useMemo<SelectionOption[]>(() => {
    const known = new Set(options.map((option) => option.id));
    const extras = value.filter((id) => !known.has(id)).map((id) => ({ id, label: id }));
    return [...extras, ...options];
  }, [options, value]);

  const trimmedQuery = query.trim();
  const filtered = useMemo(() => {
    if (!trimmedQuery) return allOptions;
    const q = normalize(trimmedQuery);
    return allOptions.filter((option) => normalize(option.label).includes(q));
  }, [allOptions, trimmedQuery]);

  const showCustom =
    allowCustomFromSearch &&
    trimmedQuery.length > 0 &&
    !allOptions.some((option) => normalize(option.label) === normalize(trimmedQuery));

  const popularOptions = useMemo(() => {
    if (!popularIds || trimmedQuery) return [];
    const set = new Set(popularIds);
    return allOptions.filter((option) => set.has(option.id));
  }, [allOptions, popularIds, trimmedQuery]);

  const isSelected = (id: string) => selected.includes(id);

  const toggle = (id: string) => {
    if (mode === "single") {
      setSelected([id]);
      return;
    }
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleDone = () => {
    onDone(selected);
    onClose();
  };

  const renderRow = (option: SelectionOption) => {
    const active = isSelected(option.id);
    return (
      <li key={option.id}>
        <button
          type="button"
          role={mode === "single" ? "radio" : "checkbox"}
          aria-checked={active}
          onClick={() => toggle(option.id)}
          className={cn(
            "flex w-full items-center gap-ds-3 rounded-[14px] border-2 px-ds-4 text-left transition-colors",
            active ? "border-primary bg-primary/5" : "border-border bg-surface-muted/40",
            focusRing,
          )}
          style={{ minHeight: 56 }}
        >
          {showSwatch ? (
            <span
              className="h-6 w-6 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: option.swatch ?? "transparent" }}
              aria-hidden
            />
          ) : null}
          <span className="min-w-0 flex-1 truncate text-base font-medium text-text-primary">
            {option.label}
          </span>
          <span
            className={cn(
              "grid shrink-0 place-items-center border-2",
              mode === "single" ? "h-6 w-6 rounded-full" : "h-6 w-6 rounded-[7px]",
              active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-transparent",
            )}
            aria-hidden
          >
            {mode === "single"
              ? active
                ? <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
                : null
              : active
                ? <CheckIcon />
                : null}
          </span>
        </button>
      </li>
    );
  };

  const renderGridCell = (option: SelectionOption) => {
    const active = isSelected(option.id);
    return (
      <button
        key={option.id}
        type="button"
        role={mode === "single" ? "radio" : "checkbox"}
        aria-checked={active}
        onClick={() => toggle(option.id)}
        className={cn(
          "grid place-items-center rounded-[14px] border-2 px-ds-2 text-center text-base font-semibold transition-colors",
          active ? "border-primary bg-primary/5 text-primary" : "border-border bg-surface-muted/40 text-text-primary",
          focusRing,
        )}
        style={{ minHeight: 56 }}
      >
        {option.label}
      </button>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn("fixed inset-0 z-[200] flex flex-col bg-surface", styles.screen)}
    >
      <header
        className="grid grid-cols-[3rem_1fr_3rem] items-center gap-ds-2 border-b border-border px-ds-2 pb-ds-3"
        style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className={cn("grid h-12 w-12 place-items-center rounded-ds-md text-text-primary", focusRing)}
        >
          <BackIcon />
        </button>
        <h1 className="min-w-0 truncate text-center text-lg font-semibold text-text-primary">{title}</h1>
        <span aria-hidden />
      </header>

      {searchable ? (
        <div className="border-b border-border px-ds-4 py-ds-3">
          <div className="flex items-center gap-ds-2 rounded-ds-md bg-surface-muted/60 px-ds-3" style={{ minHeight: 44 }}>
            <SearchIcon />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoComplete="off"
              className={cn("min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted", focusRing)}
            />
          </div>
        </div>
      ) : null}

      <div
        className="flex-1 overflow-y-auto px-ds-4 pt-ds-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        {layout === "grid" ? (
          <div className="grid grid-cols-3 gap-ds-2" role={mode === "single" ? "radiogroup" : "group"} aria-label={title}>
            {filtered.map(renderGridCell)}
          </div>
        ) : (
          <>
            {showCustom ? (
              <ul className="mb-ds-3 flex flex-col gap-ds-2">
                {renderRow({ id: trimmedQuery, label: `Use “${trimmedQuery}”` })}
              </ul>
            ) : null}

            {popularOptions.length > 0 ? (
              <>
                <p className="px-ds-1 pb-ds-2 pt-ds-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Popular
                </p>
                <ul
                  className="mb-ds-3 flex flex-col gap-ds-2"
                  role={mode === "single" ? "radiogroup" : "group"}
                  aria-label={`Popular ${title}`}
                >
                  {popularOptions.map(renderRow)}
                </ul>
                <p className="px-ds-1 pb-ds-2 pt-ds-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  All
                </p>
              </>
            ) : null}

            <ul
              className="flex flex-col gap-ds-2"
              role={mode === "single" ? "radiogroup" : "group"}
              aria-label={title}
            >
              {filtered.map(renderRow)}
            </ul>

            {filtered.length === 0 && !showCustom ? (
              <p className="px-ds-1 py-ds-6 text-center text-sm text-text-secondary">No matches found.</p>
            ) : null}
          </>
        )}
      </div>

      <div
        className="border-t border-border px-ds-4 py-ds-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      >
        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="min-h-ds-7 rounded-ds-lg text-base"
          onClick={handleDone}
        >
          {doneLabel}
        </Button>
      </div>
    </div>
  );
}
