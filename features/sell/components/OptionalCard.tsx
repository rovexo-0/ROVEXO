"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { sellFieldClassName, sellFormCardClassName } from "@/features/sell/components/sell-ui";
import { SelectionScreen } from "@/features/sell/components/SelectionScreen";
import { useSell } from "@/features/sell/context/SellProvider";
import { attributeArrayToString, attributeStringToArray } from "@/lib/sell/attribute-options";
import {
  countCompletedAttributes,
  getAttributeDefsForCategory,
  readAttributeValue,
  type AttributeDef,
} from "@/lib/sell/attribute-engine";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("h-4 w-4 text-text-secondary transition-transform", open && "rotate-180")}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5 shrink-0 text-text-muted" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function AttributeRow({
  label,
  value,
  placeholder,
  onClick,
}: {
  label: string;
  value: ReactNode;
  placeholder: string;
  onClick: () => void;
}) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Select ${label.toLowerCase()}`}
      className={cn(
        "flex w-full items-center gap-ds-3 rounded-ds-md bg-surface-muted/60 px-ds-4 text-left transition-colors active:bg-surface-muted",
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

function RemovableChips({
  values,
  ariaLabel,
  onRemove,
}: {
  values: string[];
  ariaLabel: string;
  onRemove: (value: string) => void;
}) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-ds-2" role="list" aria-label={ariaLabel}>
      {values.map((value) => (
        <span
          key={value}
          role="listitem"
          className="inline-flex items-center gap-1.5 rounded-ds-full bg-surface-muted px-ds-3 py-1 text-sm font-medium text-text-primary"
        >
          {value}
          <button
            type="button"
            onClick={() => onRemove(value)}
            aria-label={`Remove ${value}`}
            className={cn("grid h-5 w-5 place-items-center rounded-full text-text-muted hover:text-text-primary", focusRing)}
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}

export function OptionalCard() {
  const { draft, updateDraft } = useSell();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const attributeDefs = useMemo(
    () => getAttributeDefsForCategory(draft.categoryPath),
    [draft.categoryPath],
  );
  const completed = countCompletedAttributes(draft);

  const writeValue = (def: AttributeDef, value: string) => {
    if (def.target.kind === "field") {
      updateDraft({ [def.target.field]: value });
    } else {
      updateDraft({ attributes: { ...draft.attributes, [def.id]: value } });
    }
  };

  const activeDef = attributeDefs.find((def) => def.id === activeId) ?? null;

  return (
    <div className={cn(sellFormCardClassName, "gap-0 p-0")}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex min-h-ds-7 w-full items-center justify-between px-ds-4 py-ds-3 text-left",
          focusRing,
        )}
        aria-expanded={open}
        aria-controls="sell-optional-panel"
        aria-label="Optional details"
      >
        <span className="text-sm font-medium text-text-secondary">
          Optional{completed > 0 ? ` (${completed} completed)` : ""}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div id="sell-optional-panel" className="flex flex-col gap-ds-3 border-t border-border px-ds-4 pb-ds-4 pt-ds-3">
          {attributeDefs.length === 0 ? (
            <p className="text-sm text-text-secondary">No additional details for this category.</p>
          ) : (
            attributeDefs.map((def) => {
              const raw = readAttributeValue(draft, def);

              if (def.input === "text") {
                return (
                  <label key={def.id} className="flex flex-col gap-ds-1">
                    <span className="px-ds-1 text-xs font-medium text-text-muted">{def.label}</span>
                    <input
                      type="text"
                      inputMode={def.inputMode === "numeric" ? "numeric" : "text"}
                      value={raw}
                      onChange={(event) => writeValue(def, event.target.value)}
                      placeholder={def.placeholder ?? `Add ${def.label.toLowerCase()}`}
                      aria-label={def.label}
                      autoComplete="off"
                      className={cn(sellFieldClassName, focusRing)}
                    />
                  </label>
                );
              }

              if (def.input === "select-multi") {
                const values = attributeStringToArray(raw);
                return (
                  <div key={def.id} className="flex flex-col gap-ds-2">
                    <AttributeRow
                      label={def.label}
                      value={values.join(", ")}
                      placeholder={def.placeholder ?? `Select ${def.label.toLowerCase()}`}
                      onClick={() => setActiveId(def.id)}
                    />
                    <RemovableChips
                      values={values}
                      ariaLabel={`Selected ${def.label.toLowerCase()}`}
                      onRemove={(value) =>
                        writeValue(def, attributeArrayToString(values.filter((item) => item !== value)))
                      }
                    />
                  </div>
                );
              }

              return (
                <AttributeRow
                  key={def.id}
                  label={def.label}
                  value={raw}
                  placeholder={def.placeholder ?? `Select ${def.label.toLowerCase()}`}
                  onClick={() => setActiveId(def.id)}
                />
              );
            })
          )}

          <label className="flex min-h-ds-7 cursor-pointer items-center gap-ds-3">
            <input
              type="checkbox"
              checked={draft.acceptOffers}
              onChange={(event) => updateDraft({ acceptOffers: event.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            <span className="text-sm font-medium text-text-primary">Accept offers</span>
          </label>
        </div>
      ) : null}

      {activeDef && activeDef.input !== "text" ? (
        <SelectionScreen
          title={activeDef.label}
          options={activeDef.options ?? []}
          mode={activeDef.input === "select-multi" ? "multiple" : "single"}
          layout={activeDef.input === "grid-single" ? "grid" : "list"}
          searchable={activeDef.searchable}
          searchPlaceholder={activeDef.searchPlaceholder}
          popularIds={activeDef.popularIds}
          allowCustomFromSearch={activeDef.allowCustomFromSearch}
          showSwatch={activeDef.showSwatch}
          value={
            activeDef.input === "select-multi"
              ? attributeStringToArray(readAttributeValue(draft, activeDef))
              : readAttributeValue(draft, activeDef)
              ? [readAttributeValue(draft, activeDef)]
              : []
          }
          onClose={() => setActiveId(null)}
          onDone={(selected) =>
            writeValue(
              activeDef,
              activeDef.input === "select-multi"
                ? attributeArrayToString(selected)
                : selected[0] ?? "",
            )
          }
        />
      ) : null}
    </div>
  );
}
