"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { Button } from "@/components/ui/Button";
import { CURRENCY_OPTIONS } from "@/lib/account/currencies";
import { currencySchema } from "@/lib/account/schemas";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { AppSettings } from "@/lib/settings/types";

const formSchema = z.object({ currency: currencySchema });
type FormValues = z.infer<typeof formSchema>;

const selectClassName = cn(
  "w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-3 text-sm text-text-primary",
  focusRing,
);

export function AccountCurrencyPage() {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { currency: "GBP (£)" },
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/settings");
      const payload = (await response.json()) as { settings: AppSettings };
      if (!cancelled) reset({ currency: payload.settings.currency });
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (response.ok) {
      setMessage("Currency updated.");
    } else {
      setMessage("Unable to update currency.");
    }
  });

  return (
    <AccountPageShell
      title="Currency"
      subtitle="Choose how prices are displayed across ROVEXO."
      backHref="/account/settings"
      backLabel="Settings"
    >
      <form onSubmit={onSubmit} className="rx-surface-card flex flex-col gap-ds-4 p-ds-5" noValidate>
        <div>
          <label htmlFor="currency" className="text-sm font-medium text-text-primary">
            Display currency
          </label>
          <select id="currency" className={cn(selectClassName, "mt-ds-1")} {...register("currency")}>
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.currency ? <p className="text-xs text-danger">{errors.currency.message}</p> : null}
        </div>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save currency"}
        </Button>
        {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
      </form>
    </AccountPageShell>
  );
}
