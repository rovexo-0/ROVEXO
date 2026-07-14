"use client";



import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";

import { CanonicalCard } from "@/src/components/canonical";

import { focusRing } from "@/features/sell/ui/sell-classes";

import { SellInlineError, SellNavRow } from "@/features/sell/ui/SellPrimitives";

import { SellOptionPicker } from "@/features/sell/ui/SellOptionPicker";

import { useSellProgressiveFlow } from "@/features/sell/hooks/use-sell-progressive-flow";

import { useSell } from "@/features/sell/context/SellProvider";

import {

  isAttributeCompleted,

  readAttributeValue,

  type AttributeDef,

} from "@/lib/sell/attribute-engine";

import {

  suggestBrandFromText,

  suggestColourFromDescription,

  suggestColourFromTitle,

} from "@/lib/sell/deterministic-prefill";

import { getSellValidationErrorForField } from "@/lib/sell/sell-validation";
import { suggestionFieldFromAttributeId } from "@/lib/sell/suggestion-field-lock";

import { sellFieldDomId } from "@/lib/sell/sell-progressive-flow";

import type { SelectionOption } from "@/lib/sell/attribute-options";



function swatchFor(def: AttributeDef, value: string): string | undefined {

  if (!def.showSwatch || !value) return undefined;

  return def.options?.find((option) => option.id === value || option.label === value)?.swatch;

}



function ColourDot({ hex }: { hex: string }) {

  return (

    <span

      className="inline-block h-4 w-4 shrink-0 rounded-ds-full border border-border"

      style={{ backgroundColor: hex }}

      aria-hidden

    />

  );

}



function resolveSuggestedOption(def: AttributeDef, suggestion: string | null): SelectionOption | null {

  if (!suggestion) return null;

  const match = def.options?.find(

    (option) => option.id === suggestion || option.label.toLowerCase() === suggestion.toLowerCase(),

  );

  return match ?? { id: suggestion, label: suggestion };

}



export function SellProgressiveAttributes() {

  const { draft, updateDraft, showValidation } = useSell();

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



  const fieldError = (field: "brand" | "colour" | "size") => {

    if (!showValidation) return undefined;

    return getSellValidationErrorForField(draft, { title, description }, field);

  };



  return (

    <>

      {visibleAttributeDefs.map((def) => {

        const raw = readAttributeValue(draft, def);

        const completed = isAttributeCompleted(draft, def);

        const fieldId = sellFieldDomId(`attribute:${def.id}`);

        const error =

          def.id === "brand" || def.id === "colour" || def.id === "size"

            ? fieldError(def.id)

            : undefined;



        if (def.input === "text") {

          return (

            <div key={def.id} id={fieldId} className="sell-page-field">

              <CanonicalCard variant="medium" className={cn("p-ds-4", error && "ring-2 ring-destructive/40")}>

                <label className="flex flex-col gap-ds-2">

                  <span className="cds-field__label">{def.label}</span>

                  <input

                    type="text"

                    inputMode={def.inputMode === "numeric" ? "numeric" : "text"}

                    value={raw}

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

                    placeholder={def.placeholder ?? `Add ${def.label.toLowerCase()}`}

                    aria-label={def.label}

                    autoComplete="off"

                    className={cn("cds-input", focusRing)}

                  />

                </label>

              </CanonicalCard>

              <SellInlineError message={error} />

            </div>

          );

        }



        const singleSwatch = swatchFor(def, raw);

        return (

          <div key={def.id} id={fieldId} className="sell-page-field">

            <CanonicalCard variant="medium" className={cn("p-ds-2", error && "ring-2 ring-destructive/40")}>

              <SellNavRow

                label={def.label}

                value={raw}

                placeholder={def.placeholder ?? `Select ${def.label.toLowerCase()}`}

                onClick={() => setActiveId(def.id)}

                leading={singleSwatch ? <ColourDot hex={singleSwatch} /> : undefined}

              />

            </CanonicalCard>

            <SellInlineError message={error} />

          </div>

        );

      })}



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

                ? resolveSuggestedOption(activeDef, draft.color || suggestedColour)

                : null

          }

          chooseAnotherLabel="Choose another"

          onClose={() => setActiveId(null)}

          onDone={(selected) => {

            writeValue(activeDef, selected[0] ?? "");

            setActiveId(null);

          }}

        />

      ) : null}

    </>

  );

}


