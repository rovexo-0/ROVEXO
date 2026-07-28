"use client";

import { CanonicalSection, CanonicalButton, CanonicalInfoBlock, CanonicalSelector } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";

import { CURRENCY_OPTIONS } from "@/lib/account/currencies";
import { currencySchema } from "@/lib/account/schemas";
import type { AppSettings } from "@/lib/settings/types";

const formSchema = z.object({ currency: currencySchema });
type FormValues = z.infer<typeof formSchema>;

export function AccountCurrencyPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
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
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) throw new Error("unavailable");
        const payload = (await response.json()) as { settings: AppSettings };
        if (!cancelled) reset({ currency: payload.settings.currency });
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
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

  if (loadFailed) {
    return (
      <MyAccountTemplate surface="currency" title="Currency" backHref="/account/settings" showHeaderTitle>
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  return (
    <MyAccountTemplate surface="currency" title="Currency" backHref="/account/settings" showHeaderTitle>
      <div className="settings-subpage-v1 fw-engine__stack" data-full-width-surface="currency">
        <CanonicalSection title="Currency">
          <form onSubmit={onSubmit} className="fw-engine__group flex flex-col gap-ds-4" noValidate>
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
        </CanonicalSection>
      </div>
    </MyAccountTemplate>
  );
}
