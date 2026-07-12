"use client";

import { CanonicalButton, CanonicalInfoBlock, CanonicalSelector, CanonicalSwitch, CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalInput, CanonicalTextarea } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountCanonicalShell } from "@/features/account-canonical";


import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import { BUYER_REGIONS } from "@/lib/account/countries";
import { buyerPreferencesSchema, type BuyerPreferencesInput } from "@/lib/account/schemas";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type CategoryOption = { slug: string; label: string };

export function AccountBuyerPreferencesPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const {
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
      region: UK_DEFAULT_COUNTRY,
      preferredCategorySlugs: [],
    },
  });

  const selectedCategories = useWatch({ control, name: "preferredCategorySlugs" }) ?? [];
  const saveSearchAlerts = useWatch({ control, name: "saveSearchAlerts" });
  const orderUpdatesPush = useWatch({ control, name: "orderUpdatesPush" });
  const orderUpdatesEmail = useWatch({ control, name: "orderUpdatesEmail" });
  const showRecommendations = useWatch({ control, name: "showRecommendations" });
  const region = useWatch({ control, name: "region" });

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
    <AccountCanonicalShell title="Buyer preferences" backHref="/account/profile" backLabel="Settings">
      <CanonicalSection title="Buyer preferences">
        <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-ds-4" noValidate>
            <CanonicalSelector
              label="Region"
              id="region"
              kind="region"
              value={region}
              options={BUYER_REGIONS.map((entry) => ({ value: entry, label: entry }))}
              onChange={(event) => setValue("region", event.target.value, { shouldDirty: true })}
            />

            <fieldset className="flex flex-col gap-ds-2 border-none p-0">
              <legend className="text-sm font-medium text-text-primary">Preferred categories</legend>
              <p className="text-xs text-text-secondary">
                Tailor recommendations to categories you shop most.
              </p>
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

            <CanonicalSwitch
              id="saveSearchAlerts"
              label="Saved search alerts"
              description="Get notified when new listings match your saved searches."
              checked={saveSearchAlerts}
              onChange={(checked) => setValue("saveSearchAlerts", checked, { shouldDirty: true })}
            />
            <CanonicalSwitch
              id="orderUpdatesPush"
              label="Order push updates"
              description="Receive push notifications for shipping and delivery updates."
              checked={orderUpdatesPush}
              onChange={(checked) => setValue("orderUpdatesPush", checked, { shouldDirty: true })}
            />
            <CanonicalSwitch
              id="orderUpdatesEmail"
              label="Order email updates"
              description="Receive email confirmations and delivery notifications."
              checked={orderUpdatesEmail}
              onChange={(checked) => setValue("orderUpdatesEmail", checked, { shouldDirty: true })}
            />
            <CanonicalSwitch
              id="showRecommendations"
              label="Personalised recommendations"
              description="Show listings tailored to your browsing and purchase history."
              checked={showRecommendations}
              onChange={(checked) => setValue("showRecommendations", checked, { shouldDirty: true })}
            />

            <CanonicalButton type="submit" fullWidth loading={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save preferences"}
            </CanonicalButton>
            {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
          </form>
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
