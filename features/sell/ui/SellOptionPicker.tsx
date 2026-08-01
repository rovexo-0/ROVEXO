"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { RX_MODAL_BODY } from "@/lib/mobile-ui/scroll-standard";
import { sellPanel, focusRing } from "@/features/sell/ui/sell-classes";
import { SellPanelHeader } from "@/features/sell/ui/SellPrimitives";
import { CheckLineIcon, SearchLineIcon } from "@/components/icons/RvxLineIcons";
import { CanonicalMenuRow, CanonicalButton, CanonicalInput } from "@/src/components/canonical";
import type { SelectionOption } from "@/lib/sell/attribute-options";
import {
  SellPickerLeadingMark,
  SellPickerSectionLabel,
} from "@/features/sell/ui/SellPickerLeadingMark";
import {
  allSectionTitle,
  enrichPickerOption,
  resolveSellPickerVisualKind,
  type EnrichedPickerOption,
  type SellPickerVisualKind,
} from "@/features/sell/ui/sell-picker-presentation-v1";

export type SellOptionPickerProps = {
  title: string;
  /** Attribute engine id — presentation enrichment only (brand/material/condition/colour). */
  attributeId?: string;
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

function SelectedTrailing() {
  return (
    <span className="sell-option-picker__check" aria-hidden>
      <CheckLineIcon />
    </span>
  );
}

function ColourSwatchCell({
  option,
  active,
  mode,
  onSelect,
}: {
  option: EnrichedPickerOption;
  active: boolean;
  mode: "single" | "multiple";
  onSelect: () => void;
}) {
  const swatch = option.swatch ?? "#E5E7EB";
  const isGradient = swatch.includes("gradient");
  const isOther = normalize(option.label) === "other" || normalize(option.id) === "other";
  const isLight = /^(#fff|#ffffff|white)$/i.test(swatch.trim());

  return (
    <button
      type="button"
      role={mode === "multiple" ? "checkbox" : "radio"}
      aria-checked={active}
      aria-label={active ? `${option.label}, selected` : option.label}
      onClick={onSelect}
      className={cn("sell-colour-swatch", active && "sell-colour-swatch--selected", focusRing)}
    >
      <span className="sell-colour-swatch__mark">
        <span
          className={cn(
            "sell-colour-swatch__dot",
            isLight && "sell-colour-swatch__dot--light",
            isOther && "sell-colour-swatch__dot--other",
          )}
          style={isGradient ? { backgroundImage: swatch } : { backgroundColor: swatch }}
          aria-hidden
        >
          {isOther ? <span className="sell-colour-swatch__plus">+</span> : null}
        </span>
        {active ? (
          <span className="sell-colour-swatch__check" aria-hidden>
            <CheckLineIcon />
          </span>
        ) : null}
      </span>
      <span className="sell-colour-swatch__label">{option.label.replace(/^Multi-colour$/i, "Multi")}</span>
    </button>
  );
}

/**
 * Fullscreen attribute selector.
 * Single: tap → auto-save → auto-return (no Done).
 * Multiple: tap to toggle → Apply → auto-return.
 * Presentation enrichment is visual-only — option ids/labels unchanged.
 */
export function SellOptionPicker({
  title,
  attributeId,
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
  const visualKind: SellPickerVisualKind = resolveSellPickerVisualKind(attributeId, title);
  const isColourPicker = visualKind === "colour" || showSwatch;
  const isBrandPicker = visualKind === "brand";
  const isMaterialPicker = visualKind === "material";
  /** V1.1 — Brand / Material / Colour have no search (finite, scannable lists). */
  const effectiveSearchable =
    searchable && !isColourPicker && !isBrandPicker && !isMaterialPicker;
  const effectiveSearchPlaceholder = searchPlaceholder;

  const allOptions = useMemo<EnrichedPickerOption[]>(() => {
    const known = new Set<string>();
    const merged: SelectionOption[] = [];
    const extras = value
      .filter((id) => !options.some((option) => option.id === id))
      .map((id) => ({ id, label: id }));
    for (const option of [...extras, ...options]) {
      const key =
        option.label.trim().toLowerCase().replace(/[^a-z0-9&]/g, "") || option.id.toLowerCase();
      if (known.has(key)) continue;
      known.add(key);
      merged.push(option);
    }
    return merged.map((option) => enrichPickerOption(visualKind, option));
  }, [options, value, visualKind]);

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

  const resolvedPopularIds = useMemo(() => {
    if (isColourPicker) return undefined;
    if (popularIds && popularIds.length > 0) return popularIds;
    return undefined;
  }, [popularIds, isColourPicker]);

  const popularOptions = useMemo(() => {
    if (!resolvedPopularIds || trimmed) return [];
    const set = new Set(resolvedPopularIds.map((id) => id.toLowerCase()));
    const ordered: EnrichedPickerOption[] = [];
    for (const id of resolvedPopularIds) {
      const match = allOptions.find(
        (option) => option.id.toLowerCase() === id.toLowerCase() || option.label.toLowerCase() === id.toLowerCase(),
      );
      if (match) ordered.push(match);
    }
    if (ordered.length > 0) return ordered;
    return allOptions.filter((option) => set.has(option.id.toLowerCase()) || set.has(option.label.toLowerCase()));
  }, [allOptions, resolvedPopularIds, trimmed]);

  const remainderOptions = useMemo(() => {
    if (!popularOptions.length || trimmed) return filtered;
    const popular = new Set(popularOptions.map((option) => option.id));
    return filtered.filter((option) => !popular.has(option.id));
  }, [filtered, popularOptions, trimmed]);

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

  const activeIds = mode === "multiple" ? draftSelection : value;
  const useSizeGrid = layout === "grid" && !showSwatch && visualKind === "generic";

  const activate = (id: string) => {
    if (mode === "multiple") toggleMulti(id);
    else selectSingle(id);
  };

  const renderRow = (option: EnrichedPickerOption, rowKind: SellPickerVisualKind = visualKind) => {
    const active = activeIds.includes(option.id) || activeIds.includes(option.label);
    const enriched = enrichPickerOption(rowKind, option);
    const markKind: SellPickerVisualKind = rowKind === "generic" ? visualKind : rowKind;
    const showLeading = markKind !== "generic";
    return (
      <li key={option.id}>
        <CanonicalMenuRow
          title={enriched.label}
          description={rowKind === "condition" ? enriched.description : undefined}
          icon={showLeading ? <SellPickerLeadingMark option={enriched} kind={markKind} /> : undefined}
          value={active ? "Selected" : undefined}
          trailing={
            active ? (
              <SelectedTrailing />
            ) : rowKind === "condition" ? (
              <span className="sell-option-picker__radio" aria-hidden />
            ) : undefined
          }
          onClick={() => activate(option.id)}
          hideChevron
          className={cn(
            active && "sell-option-picker__row--selected",
            rowKind === "condition" && "sell-option-picker__row--condition",
          )}
          ariaLabel={active ? `${enriched.label}, selected` : enriched.label}
        />
      </li>
    );
  };

  const renderColourSwatch = (option: EnrichedPickerOption) => {
    const active = activeIds.includes(option.id) || activeIds.includes(option.label);
    return (
      <ColourSwatchCell
        key={option.id}
        option={option}
        active={active}
        mode={mode}
        onSelect={() => activate(option.id)}
      />
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
        onClick={() => activate(option.id)}
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

  const colourBody = (
    <>
      <div
        className="sell-colour-swatch-grid pb-ds-3"
        role={mode === "multiple" ? "group" : "radiogroup"}
        aria-label={title}
      >
        {filtered.map(renderColourSwatch)}
      </div>
      {filtered.length === 0 ? (
        <p className="px-ds-1 py-ds-6 text-center text-sm text-text-secondary">No matches found.</p>
      ) : null}
    </>
  );

  return (
    <ModalContainer open onClose={onClose} variant="fullscreen" zIndex={200} ariaLabel={title} lockScroll={false}>
      <div className={cn(sellPanel, "sell-compact-picker flex min-h-0 flex-1 flex-col")}>
        <SellPanelHeader title={title} onBack={onClose} />

        {effectiveSearchable ? (
          <div className="sell-option-picker__search shrink-0 border-b border-border">
            <span className="sell-option-picker__search-icon" aria-hidden>
              <SearchLineIcon />
            </span>
            <CanonicalInput
              id={`sell-option-search-${title}`}
              inputType="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={effectiveSearchPlaceholder}
              aria-label={effectiveSearchPlaceholder}
              autoComplete="off"
              className="sell-option-picker__search-field"
            />
          </div>
        ) : null}

        <div className={cn(RX_MODAL_BODY, "sell-option-picker__body min-h-0 flex-1 overflow-y-auto overscroll-contain pt-ds-2")}>
          {suggestedOption && !trimmed && mode === "single" && !isColourPicker ? (
            <>
              <div className="px-ds-1 pb-ds-2">
                <SellPickerSectionLabel
                  label={suggestedSectionTitle ?? `Suggested ${title}`}
                  variant="default"
                />
              </div>
              <ul className="mb-ds-3 flex flex-col gap-ds-1" role="list">
                {renderRow(enrichPickerOption(visualKind, suggestedOption))}
              </ul>
              <div className="mb-ds-3 border-t border-border" role="separator" aria-hidden />
              <div className="px-ds-1 pb-ds-2">
                <SellPickerSectionLabel label={chooseAnotherLabel} variant="default" />
              </div>
            </>
          ) : null}

          {isColourPicker ? (
            colourBody
          ) : useSizeGrid ? (
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
                <ul className="mb-ds-3 flex flex-col gap-ds-1">
                  {renderRow({ id: trimmed, label: `Use “${trimmed}”` }, "generic")}
                </ul>
              ) : null}

              {popularOptions.length > 0 ? (
                <>
                  <div className="px-ds-1 pb-ds-2 pt-ds-1">
                    <SellPickerSectionLabel label="Popular" variant="popular" />
                  </div>
                  <ul className="mb-ds-3 flex flex-col gap-ds-1" role="list" aria-label={`Popular ${title}`}>
                    {popularOptions.map((option) => renderRow(option))}
                  </ul>
                  <div className="px-ds-1 pb-ds-2 pt-ds-1">
                    <SellPickerSectionLabel label={allSectionTitle(visualKind, title)} variant="all" />
                  </div>
                </>
              ) : null}

              <ul className="flex flex-col gap-ds-1 pb-ds-4" role="list" aria-label={title}>
                {(popularOptions.length > 0 ? remainderOptions : filtered).map((option) => renderRow(option))}
              </ul>

              {filtered.length === 0 && !showCustom ? (
                <p className="px-ds-1 py-ds-6 text-center text-sm text-text-secondary">No matches found.</p>
              ) : null}
            </>
          )}
        </div>

        {mode === "multiple" ? (
          <div className="shrink-0 border-t border-border px-0 py-ds-2">
            <CanonicalButton fullWidth onClick={applyMulti}>
              Apply
            </CanonicalButton>
          </div>
        ) : null}
      </div>
    </ModalContainer>
  );
}
