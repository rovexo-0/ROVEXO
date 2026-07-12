"use client";

import { CanonicalButton, CanonicalInfoBlock, CanonicalInput } from "@/src/components/canonical";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { passwordChangeSchema, type PasswordChangeInput } from "@/lib/account/schemas";

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
      <CanonicalInput
        id="currentPassword"
        label="Current password"
        inputType="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <CanonicalInput
        id="newPassword"
        label="New password"
        inputType="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <CanonicalInput
        id="confirmPassword"
        label="Confirm new password"
        inputType="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <CanonicalButton type="submit" variant="secondary" loading={isSubmitting}>
        {isSubmitting ? "Updating…" : "Change password"}
      </CanonicalButton>
      {message ? (
        <CanonicalInfoBlock variant="description" aria-live="polite">
          {message}
        </CanonicalInfoBlock>
      ) : null}
    </form>
  );
}
