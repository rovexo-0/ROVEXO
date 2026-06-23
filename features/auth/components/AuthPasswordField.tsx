"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export type AuthPasswordFieldProps = {
  label: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
  hint?: string;
};

export function AuthPasswordField({
  label,
  name,
  autoComplete = "current-password",
  required = true,
  placeholder,
  minLength,
  hint,
}: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  return (
    <div className="border-b border-border/70 px-ds-4 py-ds-3 last:border-b-0">
      <label className="flex flex-col gap-ds-1">
        <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          {label}
        </span>
        <div className="relative flex items-center">
          <input
            name={name}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            required={required}
            placeholder={placeholder}
            minLength={minLength}
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
              "min-h-[44px] w-full border-0 bg-transparent p-0 pr-ds-8 text-[17px] text-text-primary outline-none placeholder:text-text-muted",
              validationMessage && "text-danger",
              focusRing,
              transitionFast,
            )}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Hide password" : "Show password"}
            className={cn(
              "absolute right-0 min-h-ds-7 min-w-ds-7 text-xs font-semibold text-primary",
              focusRing,
            )}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>
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
