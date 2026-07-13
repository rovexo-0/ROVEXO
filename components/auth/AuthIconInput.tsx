"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export type AuthIconInputProps = {
  label: string;
  name: string;
  icon: ReactNode;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  value?: string;
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  autoFocus?: boolean;
};

export function AuthIconInput({
  label,
  name,
  icon,
  type = "text",
  autoComplete,
  required = true,
  placeholder,
  defaultValue,
  minLength,
  maxLength,
  pattern,
  inputMode,
  value,
  onChange,
  autoFocus,
}: AuthIconInputProps) {
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  return (
    <div className="auth-icon-field">
      <label className="auth-icon-field__label" htmlFor={name}>
        {label}
      </label>
      <div className="auth-icon-field__control">
        <span className="auth-icon-field__icon" aria-hidden>
          {icon}
        </span>
        <input
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          inputMode={inputMode}
          autoFocus={autoFocus}
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
            "auth-icon-field__input",
            validationMessage && "auth-icon-field__input--invalid",
            focusRing,
            transitionFast,
          )}
        />
      </div>
      {validationMessage ? (
        <p className="auth-icon-field__error" role="alert">
          {validationMessage}
        </p>
      ) : null}
    </div>
  );
}
