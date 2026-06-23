"use client";

import { useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export type AuthFieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
};

export function AuthField({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  placeholder,
  defaultValue,
  hint,
  minLength,
  maxLength,
  pattern,
  inputMode,
}: AuthFieldProps) {
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  return (
    <div className="border-b border-border/70 px-ds-4 py-ds-3 last:border-b-0">
      <label className="flex flex-col gap-ds-1">
        <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          {label}
        </span>
        <input
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          inputMode={inputMode}
          onInvalid={(event) => {
            event.preventDefault();
            setValidationMessage(event.currentTarget.validationMessage);
          }}
          onInput={(event) => {
            if (validationMessage && event.currentTarget.validity.valid) {
              setValidationMessage(null);
            }
          }}
          onBlur={(event) => {
            if (!event.currentTarget.validity.valid) {
              setValidationMessage(event.currentTarget.validationMessage);
            }
          }}
          className={cn(
            "min-h-[44px] w-full border-0 bg-transparent p-0 text-[17px] text-text-primary outline-none placeholder:text-text-muted",
            "disabled:cursor-not-allowed disabled:opacity-50",
            validationMessage && "text-danger",
            focusRing,
            transitionFast,
          )}
        />
      </label>
      {validationMessage ? (
        <p className="mt-ds-1 text-xs text-danger" role="alert">
          {validationMessage}
        </p>
      ) : hint ? (
        <p className="mt-ds-1 text-xs text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}
