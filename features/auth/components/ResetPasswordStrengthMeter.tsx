"use client";

import { cn } from "@/lib/cn";
import type { PasswordStrengthResult } from "@/lib/auth/password-strength";

type ResetPasswordStrengthMeterProps = {
  strength: PasswordStrengthResult;
  hint?: string;
  id?: string;
};

export function ResetPasswordStrengthMeter({ strength, hint, id }: ResetPasswordStrengthMeterProps) {
  if (!strength.label) {
    return hint ? <p className="auth-password-strength__hint">{hint}</p> : null;
  }

  return (
    <div
      id={id}
      className="auth-password-strength"
      role="meter"
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={strength.score}
      aria-label={`Password strength: ${strength.label}`}
    >
      <div className="auth-password-strength__bars" aria-hidden>
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={cn(
              "auth-password-strength__bar",
              step <= strength.score && `auth-password-strength__bar--level-${strength.score}`,
            )}
          />
        ))}
      </div>
      <span className="auth-password-strength__label">{strength.label}</span>
    </div>
  );
}
