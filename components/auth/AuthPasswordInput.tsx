"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { EyeLineIcon, LockLineIcon } from "@/components/icons/RvxLineIcons";
import { focusRing, transitionFast } from "@/components/ui/tokens";

function EyeOffLineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M6.7 6.7C4.6 8.1 3.1 10 2.5 12c0 0 3.5 6.5 9.5 6.5 1.6 0 3.1-.4 4.4-1.1M9.9 5.1A10.7 10.7 0 0 1 12 4.5c6 0 9.5 6.5 9.5 6.5a11.2 11.2 0 0 1-2.7 3.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type AuthPasswordInputProps = {
  label: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  hint?: React.ReactNode;
};

export function AuthPasswordInput({
  label,
  name,
  autoComplete = "current-password",
  required = true,
  placeholder,
  minLength,
  value,
  onChange,
  hint,
}: AuthPasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  return (
    <div className="auth-icon-field">
      <label className="auth-icon-field__label" htmlFor={name}>
        {label}
      </label>
      <div className="auth-icon-field__control">
        <span className="auth-icon-field__icon" aria-hidden>
          <LockLineIcon className="auth-icon-field__svg" />
        </span>
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          minLength={minLength}
          value={value}
          onChange={onChange}
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
            "auth-icon-field__input auth-icon-field__input--password",
            validationMessage && "auth-icon-field__input--invalid",
            focusRing,
            transitionFast,
          )}
        />
        <button
          type="button"
          className={cn("auth-icon-field__visibility", focusRing)}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOffLineIcon className="auth-icon-field__svg" />
          ) : (
            <EyeLineIcon className="auth-icon-field__svg" />
          )}
        </button>
      </div>
      {validationMessage ? (
        <p className="auth-icon-field__error" role="alert">
          {validationMessage}
        </p>
      ) : hint ? (
        <div className="auth-icon-field__hint">{hint}</div>
      ) : null}
    </div>
  );
}
