"use client";

import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export type CanonicalRadioOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

export type CanonicalRadioGroupProps<T extends string = string> = {
  name: string;
  legend: string;
  value: T;
  options: CanonicalRadioOption<T>[];
  onChange: (value: T) => void;
  layout?: "list" | "cards";
  className?: string;
};

/**
 * Canonical radio group — list rows or selectable cards.
 */
export function CanonicalRadioGroup<T extends string = string>({
  name,
  legend,
  value,
  options,
  onChange,
  layout = "list",
  className,
}: CanonicalRadioGroupProps<T>) {
  return (
    <fieldset className={cn("cds-radio-group", className)}>
      <legend className="cds-field__label">{legend}</legend>
      <div className={cn("cds-radio-group__options", layout === "cards" && "cds-radio-group__options--cards")}>
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                layout === "cards" ? "cds-radio-card" : "cds-radio-row",
                checked && layout === "cards" && "cds-radio-card--selected",
                focusRing,
              )}
            >
              <span className="cds-radio">
                <input
                  id={id}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={checked}
                  onChange={() => onChange(option.value)}
                  className="cds-radio__input"
                />
                <span className="cds-radio__mark" aria-hidden />
              </span>
              <span className="cds-radio-row__copy">
                <span className="cds-radio-row__title">{option.label}</span>
                {option.description ? (
                  <span className="cds-radio-row__description">{option.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
