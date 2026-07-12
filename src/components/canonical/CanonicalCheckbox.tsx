"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export type CanonicalCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
  className?: string;
};

/**
 * Canonical checkbox row — form toggles inside cards and panels.
 */
export function CanonicalCheckbox({
  label,
  description,
  className,
  id,
  ...props
}: CanonicalCheckboxProps) {
  const inputId = id ?? props.name;

  return (
    <label htmlFor={inputId} className={cn("cds-checkbox-row", className)}>
      <span className="cds-checkbox">
        <input id={inputId} type="checkbox" className={cn("cds-checkbox__input", focusRing)} {...props} />
        <span className="cds-checkbox__box" aria-hidden />
      </span>
      <span className="cds-checkbox-row__copy">
        <span className="cds-checkbox-row__title">{label}</span>
        {description ? <span className="cds-checkbox-row__description">{description}</span> : null}
      </span>
    </label>
  );
}
