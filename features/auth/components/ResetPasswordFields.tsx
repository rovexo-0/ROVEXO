"use client";

import { useState } from "react";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthFieldGroup } from "@/features/auth/components/AuthFieldGroup";

export function ResetPasswordFields() {
  const [confirmError, setConfirmError] = useState<string | null>(null);

  return (
    <AuthFieldGroup>
      <AuthField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters"
      />
      <div className="border-b border-border/70 px-ds-4 py-ds-3 last:border-b-0">
        <label className="flex flex-col gap-ds-1">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Confirm password
          </span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            onBlur={(event) => {
              const form = event.currentTarget.form;
              const password = form?.querySelector<HTMLInputElement>('input[name="password"]');
              if (!password) return;

              if (event.currentTarget.value !== password.value) {
                setConfirmError("Passwords do not match.");
              } else {
                setConfirmError(null);
              }
            }}
            onInput={(event) => {
              const form = event.currentTarget.form;
              const password = form?.querySelector<HTMLInputElement>('input[name="password"]');
              if (!password) return;

              if (event.currentTarget.value === password.value) {
                setConfirmError(null);
              }
            }}
            className="min-h-[44px] w-full border-0 bg-transparent p-0 text-[17px] text-text-primary outline-none placeholder:text-text-muted"
          />
        </label>
        {confirmError ? (
          <p className="mt-ds-1 text-xs text-danger" role="alert">
            {confirmError}
          </p>
        ) : null}
      </div>
    </AuthFieldGroup>
  );
}
