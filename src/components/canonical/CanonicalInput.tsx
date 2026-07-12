"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { cdsInputTypeAttr } from "./utils";
import type { CanonicalInputType } from "./tokens";

type SharedFieldProps = {
  label?: string;
  hint?: string;
  error?: string;
  id?: string;
  className?: string;
};

export type CanonicalInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> &
  SharedFieldProps & {
    inputType?: Exclude<CanonicalInputType, "textarea">;
  };

export type CanonicalTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & SharedFieldProps;

function FieldShell({
  label,
  hint,
  error,
  id,
  className,
  children,
}: SharedFieldProps & { children: React.ReactNode }) {
  return (
    <div className={cn("cds-field", className)}>
      {label ? (
        <label htmlFor={id} className="cds-field__label">
          {label}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="cds-field__hint">{hint}</p> : null}
      {error ? <p className="cds-field__error">{error}</p> : null}
    </div>
  );
}

/**
 * Canonical text input — text, email, phone, number, price, password, search.
 */
export function CanonicalInput({
  label,
  hint,
  error,
  id,
  className,
  inputType = "text",
  ...props
}: CanonicalInputProps) {
  const inputId = id ?? props.name;
  const htmlType = cdsInputTypeAttr(inputType);
  const isSearch = inputType === "search";
  const isPrice = inputType === "price";

  return (
    <FieldShell label={label} hint={hint} error={error} id={inputId} className={className}>
      <input
        id={inputId}
        type={htmlType}
        className={cn("cds-input", isSearch && "cds-input--search")}
        inputMode={inputType === "phone" ? "tel" : isPrice ? "decimal" : undefined}
        step={isPrice ? "0.01" : undefined}
        {...props}
      />
    </FieldShell>
  );
}

/**
 * Canonical textarea input.
 */
export function CanonicalTextarea({ label, hint, error, id, className, ...props }: CanonicalTextareaProps) {
  const inputId = id ?? props.name;

  return (
    <FieldShell label={label} hint={hint} error={error} id={inputId} className={className}>
      <textarea id={inputId} className="cds-textarea" {...props} />
    </FieldShell>
  );
}
