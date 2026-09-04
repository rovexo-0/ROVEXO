"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { EyeLineIcon, LockLineIcon } from "@/components/icons/RvxLineIcons";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import { focusRing, transitionFast } from "@/components/ui/tokens";

function EyeOffLineIcon({ className }: { className?: string }) {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.passwordHide} className={className} />;
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
  describedBy?: string;
  inputId?: string;
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
  describedBy,
  inputId,
}: AuthPasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const fieldId = inputId ?? name;

  return (
    <div className="auth-icon-field">
      <label className="auth-icon-field__label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="auth-icon-field__control">
        <span className="auth-icon-field__icon" aria-hidden>
          <LockLineIcon className="auth-icon-field__svg" />
        </span>
        <input
          id={fieldId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          minLength={minLength}
          value={value}
          onChange={onChange}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="none"
          aria-describedby={describedBy}
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
