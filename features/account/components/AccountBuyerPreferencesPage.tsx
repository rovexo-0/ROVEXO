"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { Button } from "@/components/ui/Button";
import { BUYER_REGIONS } from "@/lib/account/countries";
import { buyerPreferencesSchema, type BuyerPreferencesInput } from "@/lib/account/schemas";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type CategoryOption = { slug: string; label: string };

const selectClassName = cn(
  "w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-3 text-sm text-text-primary",
  focusRing,
);

export function AccountBuyerPreferencesPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isSubmitting },
  } = useForm<BuyerPreferencesInput>({
    resolver: zodResolver(buyerPreferencesSchema),
    defaultValues: {
      saveSearchAlerts: true,
      orderUpdatesPush: true,
      orderUpdatesEmail: true,
      showRecommendations: true,
      region: "Ireland",
      preferredCategorySlugs: [],
    },
  });

  const selectedCategories = useWatch({ control, name: "preferredCategorySlugs" }) ?? [];

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [prefsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/account/buyer-preferences"),
        fetch("/api/categories/tree"),
      ]);
      const prefsPayload = (await prefsResponse.json()) as { preferences: BuyerPreferencesInput };
      const categoriesPayload = (await categoriesResponse.json()) as {
        tree: Array<{ slug: string; name: string }>;
      };
      if (!cancelled) {
        reset(prefsPayload.preferences);
        setCategories(
          (categoriesPayload.tree ?? []).map((entry) => ({
            slug: entry.slug,
            label: entry.name,
          })),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const toggleCategory = (slug: string) => {
    const next = selectedCategories.includes(slug)
      ? selectedCategories.filter((value) => value !== slug)
      : [...selectedCategories, slug].slice(0, 12);
    setValue("preferredCategorySlugs", next, { shouldDirty: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch("/api/account/buyer-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: string };
    if (response.ok) {
      setMessage("Buyer preferences saved.");
    } else {
      setMessage(payload.error ?? "Unable to save preferences.");
    }
  });

  return (
    <AccountPageShell
      title="Buyer preferences"
      subtitle="Personalise alerts, region, and category interests."
      backHref="/account/profile"
      backLabel="Settings"
    >
      <form onSubmit={onSubmit} className="premium-card flex flex-col gap-ds-4 p-ds-5" noValidate>
        <div>
          <label htmlFor="region" className="text-sm font-medium text-text-primary">
            Region
          </label>
          <select id="region" className={cn(selectClassName, "mt-ds-1")} {...register("region")}>
            {BUYER_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-col gap-ds-2">
          <legend className="text-sm font-medium text-text-primary">Preferred categories</legend>
          <p className="text-xs text-text-secondary">Tailor recommendations to categories you shop most.</p>
          <div className="flex flex-wrap gap-ds-2">
            {categories.map((category) => {
              const active = selectedCategories.includes(category.slug);
              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => toggleCategory(category.slug)}
                  className={cn(
                    "rounded-ds-full px-ds-3 py-ds-1.5 text-xs font-medium",
                    active ? "bg-primary text-primary-foreground" : "bg-surface-muted text-text-secondary",
                    focusRing,
                  )}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex items-start gap-ds-3 text-sm">
          <input type="checkbox" className="mt-1" {...register("saveSearchAlerts")} />
          <span>
            <span className="font-medium text-text-primary">Saved search alerts</span>
            <span className="mt-ds-1 block text-text-secondary">
              Get notified when new listings match your saved searches.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-ds-3 text-sm">
          <input type="checkbox" className="mt-1" {...register("orderUpdatesPush")} />
          <span>
            <span className="font-medium text-text-primary">Order push updates</span>
            <span className="mt-ds-1 block text-text-secondary">
              Receive push notifications for shipping and delivery updates.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-ds-3 text-sm">
          <input type="checkbox" className="mt-1" {...register("orderUpdatesEmail")} />
          <span>
            <span className="font-medium text-text-primary">Order email updates</span>
            <span className="mt-ds-1 block text-text-secondary">
              Receive email confirmations and delivery notifications.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-ds-3 text-sm">
          <input type="checkbox" className="mt-1" {...register("showRecommendations")} />
          <span>
            <span className="font-medium text-text-primary">Personalised recommendations</span>
            <span className="mt-ds-1 block text-text-secondary">
              Show listings tailored to your browsing and purchase history.
            </span>
          </span>
        </label>

        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save preferences"}
        </Button>
        {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
      </form>
    </AccountPageShell>
  );
}
