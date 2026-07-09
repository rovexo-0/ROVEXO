"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { AuthFieldGroup } from "@/features/auth/components/AuthFieldGroup";
import { AuthField } from "@/features/auth/components/AuthField";
import { AUTH_EMAIL_PLACEHOLDER } from "@/lib/email/constants";

function passwordStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: "" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: "Weak" };
  if (score <= 3) return { score, label: "Fair" };
  if (score <= 4) return { score, label: "Good" };
  return { score, label: "Strong" };
}

export function RegisterFields() {
  const [password, setPassword] = useState("");
  const strength = useMemo(() => passwordStrength(password), [password]);

  return (
    <>
      <AuthFieldGroup>
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={AUTH_EMAIL_PLACEHOLDER}
        />
      </AuthFieldGroup>

      <AuthFieldGroup className="mt-ds-1">
        <div className="border-b border-border/70 px-ds-4 py-ds-3 last:border-b-0">
          <label className="flex flex-col gap-ds-1">
            <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Password
            </span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-[44px] w-full border-0 bg-transparent p-0 text-[17px] text-text-primary outline-none placeholder:text-text-muted"
            />
          </label>
          {password ? (
            <div className="mt-ds-2 flex items-center gap-ds-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4, 5].map((step) => (
                  <span
                    key={step}
                    className={cn(
                      "h-1 flex-1 rounded-ds-full",
                      step <= strength.score ? "bg-primary" : "bg-surface-muted",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-text-secondary">{strength.label}</span>
            </div>
          ) : (
            <p className="mt-ds-1 text-xs text-text-secondary">At least 8 characters</p>
          )}
        </div>
      </AuthFieldGroup>

      <p className="mt-ds-3 text-center text-xs text-text-secondary">
        You can complete your profile after creating your ROVEXO account.
      </p>
    </>
  );
}
