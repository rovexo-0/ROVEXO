"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { sellCard, sellInput, focusRing } from "@/features/sell/ui/sell-classes";
import { SellNavRow } from "@/features/sell/ui/SellPrimitives";
import { SellOptionPicker } from "@/features/sell/ui/SellOptionPicker";
import { useSell } from "@/features/sell/context/SellProvider";
import {
  getAttributeDefsForCategory,
  isAttributeCompleted,
  readAttributeValue,
  type AttributeDef,
} from "@/lib/sell/attribute-engine";

const RECOMMENDED_IDS = new Set(["measurements", "material", "brand", "condition"]);

function swatchFor(def: AttributeDef, value: string): string | undefined {
  if (!def.showSwatch || !value) return undefined;
  return def.options?.find((option) => option.id === value || option.label === value)?.swatch;
}

function ColourDot({ hex }: { hex: string }) {
  return <span className="inline-block h-4 w-4 shrink-0 rounded-ds-full border border-border" style={{ backgroundColor: hex }} aria-hidden />;
}

export function SellAttributesBlock() {
  const { draft, updateDraft } = useSell();
  const [activeId, setActiveId] = useState<string | null>(null);

  const attributeDefs = useMemo(
    () => getAttributeDefsForCategory(draft.categoryPath),
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
      <div className="mb-ds-3 flex items-center justify-between gap-ds-2">
        <h2 className="text-sm font-semibold text-text-primary">Item details</h2>
        {completedCount > 0 ? (
          <span className="text-xs tabular-nums text-text-muted">{completedCount} / {attributeDefs.length}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-ds-2">
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

          const singleSwatch = swatchFor(def, raw);
          return (
            <SellNavRow
              key={def.id}
              label={def.label}
              value={raw}
              placeholder={def.placeholder ?? `Select ${def.label.toLowerCase()}`}
              onClick={() => setActiveId(def.id)}
              recommended={recommended}
              leading={singleSwatch ? <ColourDot hex={singleSwatch} /> : undefined}
            />
          );
        })}
      </div>

      {activeDef ? (
        <SellOptionPicker
          title={activeDef.label}
          options={activeDef.options ?? []}
          mode="single"
          layout={activeDef.input === "grid-single" ? "grid" : "list"}
          searchable={activeDef.searchable}
          searchPlaceholder={activeDef.searchPlaceholder}
          popularIds={activeDef.popularIds}
          allowCustomFromSearch={activeDef.allowCustomFromSearch}
          showSwatch={activeDef.showSwatch}
          value={readAttributeValue(draft, activeDef) ? [readAttributeValue(draft, activeDef)] : []}
          onClose={() => setActiveId(null)}
          onDone={(selected) => writeValue(activeDef, selected[0] ?? "")}
        />
      ) : null}
    </section>
  );
}
