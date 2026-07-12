"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { CURRENCY_OPTIONS } from "@/lib/account/currencies";
import { currencySchema } from "@/lib/account/schemas";
import type { AppSettings } from "@/lib/settings/types";

const formSchema = z.object({ currency: currencySchema });
type FormValues = z.infer<typeof formSchema>;

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
    <AccountCanonicalShell title="Currency" backHref="/account/settings">
      <CanonicalSection title="Currency">
        <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-ds-4" noValidate>
            <CanonicalSelector
              label="Display currency"
              id="currency"
              kind="currency"
              options={CURRENCY_OPTIONS.map((option) => ({
                value: option.code,
                label: option.label,
              }))}
              error={errors.currency?.message}
              {...register("currency")}
            />
            <CanonicalButton type="submit" fullWidth loading={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save currency"}
            </CanonicalButton>
            {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
          </form>
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
