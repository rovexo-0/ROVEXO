"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { TIMEZONE_OPTIONS } from "@/lib/account/timezones";
import { timezoneSchema } from "@/lib/account/schemas";
import type { AppSettings } from "@/lib/settings/types";

const formSchema = z.object({ timezone: timezoneSchema });
type FormValues = z.infer<typeof formSchema>;

export function AccountTimezonePage() {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { timezone: "Europe/Dublin" },
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/settings");
      const payload = (await response.json()) as { settings: AppSettings };
      if (!cancelled) reset({ timezone: payload.settings.timezone });
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
      setMessage("Timezone updated.");
    } else {
      setMessage("Unable to update timezone.");
    }
  });

  return (
    <AccountCanonicalShell title="Timezone" backHref="/account/settings">
      <CanonicalSection title="Timezone">
        <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-ds-4" noValidate>
            <CanonicalSelector
              label="Timezone"
              id="timezone"
              kind="generic"
              options={TIMEZONE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              error={errors.timezone?.message}
              {...register("timezone")}
            />
            <CanonicalButton type="submit" fullWidth loading={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save timezone"}
            </CanonicalButton>
            {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
          </form>
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
