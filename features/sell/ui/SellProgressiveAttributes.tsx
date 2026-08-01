"use client";

import { useMemo, useState } from "react";
import { SellInlineError, SellNavRow } from "@/features/sell/ui/SellPrimitives";
import { SellOptionPicker } from "@/features/sell/ui/SellOptionPicker";
import { CanonicalInput } from "@/src/components/canonical";
import { useSellProgressiveFlow } from "@/features/sell/hooks/use-sell-progressive-flow";
import { useSell } from "@/features/sell/context/SellProvider";
import { readAttributeValue, type AttributeDef } from "@/lib/sell/attribute-engine";
import {
  suggestBrandFromText,
  suggestColourFromDescription,
  suggestColourFromTitle,
} from "@/lib/sell/deterministic-prefill";
import { suggestionFieldFromAttributeId } from "@/lib/sell/suggestion-field-lock";
import { sellFieldDomId } from "@/lib/sell/sell-progressive-flow";
import type { SelectionOption } from "@/lib/sell/attribute-options";

function parseMulti(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatMulti(values: string[]): string {
  return values.map((v) => v.trim()).filter(Boolean).join(", ");
}

function resolveSuggestedOption(def: AttributeDef, suggestion: string | null): SelectionOption | null {
  if (!suggestion) return null;
  const match = def.options?.find(
    (option) => option.id === suggestion || option.label.toLowerCase() === suggestion.toLowerCase(),
  );
  return match ?? { id: suggestion, label: suggestion };
}

function displayValue(def: AttributeDef, raw: string): string {
  if (!raw) return "";
  if (def.input === "select-multi") {
    return formatMulti(
      parseMulti(raw).map((id) => def.options?.find((o) => o.id === id || o.label === id)?.label ?? id),
    );
  }
  return def.options?.find((o) => o.id === raw || o.label === raw)?.label ?? raw;
}

/**
 * Taxonomy-driven Sell attributes — only category-supported fields.
 * Order follows attribute engine map (Condition included when taxonomy requires it).
 */
export function SellProgressiveAttributes() {
  const { draft, updateDraft } = useSell();
  const { visibleAttributeDefs, scrollToNextStep } = useSellProgressiveFlow();
  const [activeId, setActiveId] = useState<string | null>(null);

  const title = draft.title;
  const description = draft.description;

  const activeDef = useMemo(
    () => visibleAttributeDefs.find((def) => def.id === activeId) ?? null,
    [activeId, visibleAttributeDefs],
  );

  const suggestedBrand = useMemo(() => suggestBrandFromText(title, description), [description, title]);
  const suggestedColour = useMemo(() => {
    if (draft.userModified?.colour) return null;
    return suggestColourFromTitle(title) ?? suggestColourFromDescription(description);
  }, [description, draft.userModified?.colour, title]);

  if (!draft.categoryPath || visibleAttributeDefs.length === 0) return null;

  const writeValue = (def: AttributeDef, value: string) => {
    const field = suggestionFieldFromAttributeId(def.id);
    if (def.id === "condition") {
      updateDraft({ condition: value }, { userModifiedFields: ["condition"] });
      scrollToNextStep("condition");
      return;
    }
    if (def.target.kind === "field") {
      updateDraft({ [def.target.field]: value }, { userModifiedFields: [field] });
    } else {
      updateDraft(
        { attributes: { ...draft.attributes, [def.id]: value } },
        { userModifiedFields: [field] },
      );
    }
    scrollToNextStep(`attribute:${def.id}`);
  };

  const isMulti = activeDef?.input === "select-multi";

  return (
    <>
      {visibleAttributeDefs.map((def) => {
        const raw = readAttributeValue(draft, def);
        const fieldId =
          def.id === "condition" ? sellFieldDomId("condition") : sellFieldDomId(`attribute:${def.id}`);

        if (def.input === "text") {
          return (
            <div key={def.id} id={fieldId} className="w-full max-w-none sell-aa-block">
              <CanonicalInput
                id={`${fieldId}-input`}
                label={def.label}
                value={raw}
                inputMode={def.inputMode === "numeric" ? "numeric" : "text"}
                onChange={(event) => {
                  const value = event.target.value;
                  const field = suggestionFieldFromAttributeId(def.id);
                  if (def.target.kind === "field") {
                    updateDraft({ [def.target.field]: value }, { userModifiedFields: [field] });
                  } else {
                    updateDraft(
                      { attributes: { ...draft.attributes, [def.id]: value } },
                      { userModifiedFields: [field] },
                    );
                  }
                }}
                onBlur={() => {
                  if (raw.trim()) scrollToNextStep(`attribute:${def.id}`);
                }}
                placeholder={def.placeholder || undefined}
                aria-label={def.label}
                autoComplete="off"
              />
            </div>
          );
        }

        return (
          <div key={def.id} id={fieldId} className="w-full max-w-none">
            <SellNavRow
              label={def.label}
              value={displayValue(def, raw) || undefined}
              placeholder=""
              onClick={() => setActiveId(def.id)}
              iconFieldId={def.id}
            />
            <SellInlineError message={undefined} />
          </div>
        );
      })}

      {activeDef ? (
        <SellOptionPicker
          title={activeDef.label}
          attributeId={activeDef.id}
          options={activeDef.options ?? []}
          mode={isMulti ? "multiple" : "single"}
          layout={activeDef.input === "grid-single" ? "grid" : "list"}
          searchable={activeDef.searchable}
          searchPlaceholder={activeDef.searchPlaceholder}
          popularIds={activeDef.popularIds}
          allowCustomFromSearch={activeDef.allowCustomFromSearch}
          showSwatch={activeDef.showSwatch}
          value={
            isMulti
              ? parseMulti(readAttributeValue(draft, activeDef))
              : readAttributeValue(draft, activeDef)
                ? [readAttributeValue(draft, activeDef)]
                : []
          }
          suggestedSectionTitle={
            activeDef.id === "brand"
              ? "Suggested Brand"
              : activeDef.id === "colour"
                ? "Suggested Colour"
                : undefined
          }
          suggestedOption={
            activeDef.id === "brand" && !draft.userModified?.brand
              ? resolveSuggestedOption(activeDef, suggestedBrand)
              : activeDef.id === "colour" && !draft.userModified?.colour
                ? resolveSuggestedOption(activeDef, parseMulti(draft.color)[0] || suggestedColour)
                : null
          }
          chooseAnotherLabel="Choose another"
          onClose={() => setActiveId(null)}
          onDone={(selected) => {
            writeValue(activeDef, isMulti ? formatMulti(selected) : (selected[0] ?? ""));
            setActiveId(null);
          }}
        />
      ) : null}
    </>
  );
}
