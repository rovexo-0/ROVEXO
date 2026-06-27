"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { Button } from "@/components/ui/Button";
import {
  sellerShippingSettingsSchema,
  type SellerShippingSettingsFormInput,
  type SellerShippingSettingsInput,
} from "@/lib/account/schemas";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const inputClassName = cn(
  "w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-3 text-sm text-text-primary",
  focusRing,
);

export function AccountSellerShippingPage() {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SellerShippingSettingsFormInput>({
    resolver: zodResolver(sellerShippingSettingsSchema),
    defaultValues: {
      handlingTimeDays: 1,
      dispatchTimeDays: 1,
      baseShippingCost: 0,
      freeShippingThreshold: null,
      defaultCarrier: "Royal Mail",
      shipsTo: "Ireland",
      localPickupEnabled: false,
      internationalShippingEnabled: false,
      returnPolicyDays: 14,
    },
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/account/seller-shipping");
      const payload = (await response.json()) as { settings: SellerShippingSettingsInput };
      if (!cancelled) reset(payload.settings);
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const parsed = sellerShippingSettingsSchema.parse(values);
    const response = await fetch("/api/account/seller-shipping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed satisfies SellerShippingSettingsInput),
    });
    const payload = (await response.json()) as { error?: string };
    if (response.ok) {
      setMessage("Shipping settings saved.");
    } else {
      setMessage(payload.error ?? "Unable to save shipping settings.");
    }
  });

  return (
    <AccountPageShell
      title="Seller shipping settings"
      subtitle="Configure handling times, carriers, and delivery options."
      backHref="/account/profile"
      backLabel="Settings"
    >
      <form onSubmit={onSubmit} className="rx-surface-card flex flex-col gap-ds-4 p-ds-5" noValidate>
        <div className="grid gap-ds-3 sm:grid-cols-2">
          <div>
            <label htmlFor="handlingTimeDays" className="text-sm font-medium">
              Processing time (days)
            </label>
            <input
              id="handlingTimeDays"
              type="number"
              min={0}
              max={30}
              className={cn(inputClassName, "mt-ds-1")}
              {...register("handlingTimeDays")}
            />
            {errors.handlingTimeDays ? (
              <p className="text-xs text-danger">{errors.handlingTimeDays.message}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="dispatchTimeDays" className="text-sm font-medium">
              Dispatch time (days)
            </label>
            <input
              id="dispatchTimeDays"
              type="number"
              min={0}
              max={30}
              className={cn(inputClassName, "mt-ds-1")}
              {...register("dispatchTimeDays")}
            />
            {errors.dispatchTimeDays ? (
              <p className="text-xs text-danger">{errors.dispatchTimeDays.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-ds-3 sm:grid-cols-2">
          <div>
            <label htmlFor="baseShippingCost" className="text-sm font-medium">
              Standard shipping cost
            </label>
            <input
              id="baseShippingCost"
              type="number"
              min={0}
              step="0.01"
              className={cn(inputClassName, "mt-ds-1")}
              {...register("baseShippingCost")}
            />
            {errors.baseShippingCost ? (
              <p className="text-xs text-danger">{errors.baseShippingCost.message}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="returnPolicyDays" className="text-sm font-medium">
              Return policy (days)
            </label>
            <input
              id="returnPolicyDays"
              type="number"
              min={0}
              max={90}
              className={cn(inputClassName, "mt-ds-1")}
              {...register("returnPolicyDays")}
            />
            {errors.returnPolicyDays ? (
              <p className="text-xs text-danger">{errors.returnPolicyDays.message}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="defaultCarrier" className="text-sm font-medium">
            Default carrier
          </label>
          <input id="defaultCarrier" className={cn(inputClassName, "mt-ds-1")} {...register("defaultCarrier")} />
          {errors.defaultCarrier ? (
            <p className="text-xs text-danger">{errors.defaultCarrier.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="shipsTo" className="text-sm font-medium">
            Ships to
          </label>
          <input id="shipsTo" className={cn(inputClassName, "mt-ds-1")} {...register("shipsTo")} />
          {errors.shipsTo ? <p className="text-xs text-danger">{errors.shipsTo.message}</p> : null}
        </div>

        <div>
          <label htmlFor="freeShippingThreshold" className="text-sm font-medium">
            Free shipping threshold (optional)
          </label>
          <input
            id="freeShippingThreshold"
            type="number"
            min={0}
            step="0.01"
            className={cn(inputClassName, "mt-ds-1")}
            {...register("freeShippingThreshold")}
          />
        </div>

        <label className="flex items-center gap-ds-2 text-sm">
          <input type="checkbox" {...register("localPickupEnabled")} />
          Offer local pickup
        </label>
        <label className="flex items-center gap-ds-2 text-sm">
          <input type="checkbox" {...register("internationalShippingEnabled")} />
          International shipping
        </label>

        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save shipping settings"}
        </Button>
        {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
      </form>
    </AccountPageShell>
  );
}
