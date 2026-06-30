"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { AuthFieldGroup } from "@/features/auth/components/AuthFieldGroup";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthSelect } from "@/features/auth/components/AuthSelect";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const usernameValid = /^[a-z0-9_]{3,30}$/.test(username);
  const usernameHint =
    username.length === 0
      ? "Lowercase letters, numbers, and underscores only"
      : usernameValid
        ? "Username format looks good"
        : "Use 3–30 characters: lowercase letters, numbers, underscores";

  const strength = useMemo(() => passwordStrength(password), [password]);

  return (
    <>
      <AuthFieldGroup>
        <AuthField label="Full name" name="fullName" autoComplete="name" placeholder="Jane Smith" />
        <div className="border-b border-border/70 px-ds-4 py-ds-3 last:border-b-0">
          <label className="flex flex-col gap-ds-1">
            <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Username
            </span>
            <input
              name="username"
              autoComplete="username"
              required
              placeholder="yourname"
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_]+"
              value={username}
              onChange={(event) => setUsername(event.target.value.trim().toLowerCase())}
              className="min-h-[44px] w-full border-0 bg-transparent p-0 text-[17px] text-text-primary outline-none placeholder:text-text-muted"
            />
          </label>
          <p
            className={cn(
              "mt-ds-1 text-xs",
              username.length > 0 && !usernameValid ? "text-danger" : "text-text-secondary",
            )}
          >
            {usernameHint}
          </p>
        </div>
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
        <AuthSelect
          label="Account type"
          name="role"
          defaultValue="buyer"
          options={[
            { value: "buyer", label: "Buyer" },
            { value: "seller", label: "Seller" },
            { value: "business", label: "Business" },
          ]}
        />
        <AuthField
          label="Business name"
          name="businessName"
          required={false}
          placeholder="Optional — required for business accounts"
        />
      </AuthFieldGroup>
    </>
  );
}
