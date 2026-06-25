"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { passwordChangeSchema, type PasswordChangeInput } from "@/lib/account/schemas";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { useState } from "react";

const inputClassName = cn(
  "w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-3 text-sm text-text-primary",
  focusRing,
);

export function PasswordChangeForm() {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to change password.");
      return;
    }
    reset();
    setMessage("Password updated successfully.");
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-ds-3" noValidate>
      <div>
        <label htmlFor="currentPassword" className="text-sm font-medium text-text-primary">
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          className={cn(inputClassName, "mt-ds-1")}
          {...register("currentPassword")}
        />
        {errors.currentPassword ? (
          <p className="mt-1 text-xs text-danger">{errors.currentPassword.message}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="newPassword" className="text-sm font-medium text-text-primary">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          className={cn(inputClassName, "mt-ds-1")}
          {...register("newPassword")}
        />
        {errors.newPassword ? (
          <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="text-sm font-medium text-text-primary">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={cn(inputClassName, "mt-ds-1")}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
        ) : null}
      </div>
      <Button type="submit" variant="secondary" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Change password"}
      </Button>
      {message ? (
        <p className="text-sm text-text-secondary" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
