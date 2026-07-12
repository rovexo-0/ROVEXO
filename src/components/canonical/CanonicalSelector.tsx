"use client";

import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import type { CanonicalSelectorKind, CanonicalSelectorOption, CanonicalSelectorOptionGroup } from "./tokens";

export type CanonicalSelectorProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label?: string;
  hint?: string;
  error?: string;
  kind?: CanonicalSelectorKind;
  options?: CanonicalSelectorOption[];
  groups?: CanonicalSelectorOptionGroup[];
  placeholder?: string;
  className?: string;
};

/**
 * Canonical selector — category, brand, country, currency, language, and generic selects.
 */
export function CanonicalSelector({
  label,
  hint,
  error,
  kind = "generic",
  options = [],
  groups,
  placeholder,
  id,
  className,
  ...props
}: CanonicalSelectorProps) {
  const selectId = id ?? props.name;
  const dataKind = kind;

  return (
    <div className={cn("cds-field", className)}>
      {label ? (
        <label htmlFor={selectId} className="cds-field__label">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className="cds-select"
        data-cds-selector={dataKind}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled={props.required}>
            {placeholder}
          </option>
        ) : null}
        {groups?.length
          ? groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
      </select>
      {hint && !error ? <p className="cds-field__hint">{hint}</p> : null}
      {error ? <p className="cds-field__error">{error}</p> : null}
    </div>
  );
}
