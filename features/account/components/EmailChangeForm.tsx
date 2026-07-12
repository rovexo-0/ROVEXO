"use client";

import { CanonicalButton, CanonicalInfoBlock, CanonicalInput } from "@/src/components/canonical";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { emailChangeSchema, type EmailChangeInput } from "@/lib/account/schemas";

type EmailChangeFormProps = {
  currentEmail: string;
  compact?: boolean;
};

export function EmailChangeForm({ currentEmail, compact = false }: EmailChangeFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmailChangeInput>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: { email: currentEmail },
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch("/api/profile/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    if (response.ok) {
      setMessage(payload.message ?? "Confirmation email sent.");
      reset({ email: values.email });
    } else {
      setMessage(payload.error ?? "Unable to update email.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-ds-3" noValidate>
      <CanonicalInput
        id="new-email"
        label={compact ? "Email" : "New email address"}
        inputType="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <CanonicalButton type="submit" variant={compact ? "ghost" : "secondary"} loading={isSubmitting}>
        {isSubmitting ? "Sending…" : compact ? "Update Email" : "Update email"}
      </CanonicalButton>
      {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
    </form>
  );
}
