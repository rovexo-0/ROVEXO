"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { sellCard, sellInput, focusRing } from "@/features/sell/ui/sell-classes";
import { SellNavRow } from "@/features/sell/ui/SellPrimitives";
import { SellOptionPicker } from "@/features/sell/ui/SellOptionPicker";
import { useSell } from "@/features/sell/context/SellProvider";
import {
  attributeArrayToString,
  attributeStringToArray,
} from "@/lib/sell/attribute-options";
import {
  getAttributeDefsForCategory,
  isAttributeCompleted,
  readAttributeValue,
  type AttributeDef,
} from "@/lib/sell/attribute-engine";

const RECOMMENDED_IDS = new Set(["measurements", "material"]);

function swatchFor(def: AttributeDef, value: string): string | undefined {
  if (!def.showSwatch || !value) return undefined;
  return def.options?.find((option) => option.id === value || option.label === value)?.swatch;
}

function ColourDot({ hex }: { hex: string }) {
  return <span className="inline-block h-4 w-4 shrink-0 rounded-ds-full border border-border" style={{ backgroundColor: hex }} aria-hidden />;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      stroke="currentColor"
      className={cn("h-5 w-5 shrink-0 text-text-muted transition-transform duration-300", open && "rotate-180")}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export function SellAttributesBlock() {
  const { draft, updateDraft } = useSell();
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Only category-relevant attributes, excluding condition (dedicated block).
  const attributeDefs = useMemo(
    () => getAttributeDefsForCategory(draft.categoryPath).filter((def) => def.id !== "condition"),
    [draft.categoryPath],
  );

  const completedCount = useMemo(
    () => attributeDefs.reduce((total, def) => (isAttributeCompleted(draft, def) ? total + 1 : total), 0),
    [attributeDefs, draft],
  );

  if (!draft.categoryPath || attributeDefs.length === 0) return null;

  const activeDef = attributeDefs.find((def) => def.id === activeId) ?? null;

  const writeValue = (def: AttributeDef, value: string) => {
    if (def.target.kind === "field") {
      updateDraft({ [def.target.field]: value });
    } else {
      updateDraft({ attributes: { ...draft.attributes, [def.id]: value } });
    }
  };

  return (
    <section className={sellCard} aria-label="Item details">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className={cn("-m-ds-1 flex items-center justify-between gap-ds-3 rounded-ds-md p-ds-1 text-left", focusRing)}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-text-primary">Add item details</span>
          <span className="block text-xs text-text-muted">
            {completedCount > 0 ? `${completedCount} added · optional` : "Optional — brand, size, colour and more"}
          </span>
        </span>
        <Chevron open={expanded} />
      </button>

      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className={cn("flex flex-col gap-ds-2", expanded ? "pt-ds-3" : "")}>
            {attributeDefs.map((def) => {
              const raw = readAttributeValue(draft, def);
              const recommended = RECOMMENDED_IDS.has(def.id);

              if (def.input === "text") {
                return (
                  <label key={def.id} className="flex flex-col gap-ds-1">
                    <span className="px-ds-1 text-xs font-medium text-text-muted">
                      {def.label}
                      {recommended ? <span className="ml-1 font-normal">(recommended)</span> : null}
                    </span>
                    <input
                      type="text"
                      inputMode={def.inputMode === "numeric" ? "numeric" : "text"}
                      value={raw}
                      onChange={(event) => writeValue(def, event.target.value)}
                      placeholder={def.placeholder ?? `Add ${def.label.toLowerCase()}`}
                      aria-label={def.label}
                      autoComplete="off"
                      className={cn(sellInput, focusRing)}
                    />
                  </label>
                );
              }

              if (def.input === "select-multi") {
                const values = attributeStringToArray(raw);
                const hex = def.showSwatch && values[0] ? swatchFor(def, values[0]) : undefined;
                return (
                  <SellNavRow
                    key={def.id}
                    label={def.label}
                    value={values.join(", ")}
                    placeholder={def.placeholder ?? `Add ${def.label.toLowerCase()}`}
                    onClick={() => setActiveId(def.id)}
                    recommended={recommended}
                    leading={hex ? <ColourDot hex={hex} /> : undefined}
                  />
                );
              }

              const singleSwatch = swatchFor(def, raw);
              return (
                <SellNavRow
                  key={def.id}
                  label={def.label}
                  value={raw}
                  placeholder={def.placeholder ?? `Add ${def.label.toLowerCase()}`}
                  onClick={() => setActiveId(def.id)}
                  recommended={recommended}
                  leading={singleSwatch ? <ColourDot hex={singleSwatch} /> : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>

      {activeDef ? (
        <SellOptionPicker
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
              activeDef.input === "select-multi" ? attributeArrayToString(selected) : (selected[0] ?? ""),
            )
          }
        />
      ) : null}
    </section>
  );
}
