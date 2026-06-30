"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { emailChangeSchema, type EmailChangeInput } from "@/lib/account/schemas";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const inputClassName = cn(
  "w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-3 text-sm text-text-primary",
  focusRing,
);

type EmailChangeFormProps = {
  currentEmail: string;
};

export function EmailChangeForm({ currentEmail }: EmailChangeFormProps) {
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
      <div>
        <label htmlFor="new-email" className="text-sm font-medium text-text-primary">
          New email address
        </label>
        <input
          id="new-email"
          type="email"
          autoComplete="email"
          className={cn(inputClassName, "mt-ds-1")}
          {...register("email")}
        />
        {errors.email ? <p className="text-xs text-danger">{errors.email.message}</p> : null}
      </div>
      <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Update email"}
      </Button>
      {message ? <p className="text-xs text-text-secondary">{message}</p> : null}
    </form>
  );
}
