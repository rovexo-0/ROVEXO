"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import {
  DEFAULT_MARKETPLACE_PRICING,
  type MarketplacePricingSettings,
} from "@/lib/promotions/marketplace-pricing";

type PricingResponse = {
  settings: MarketplacePricingSettings;
};

function centsToPounds(cents: number): string {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

function poundsToCents(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

export default function SuperAdminPricingPage() {
  const [settings, setSettings] = useState<MarketplacePricingSettings>(DEFAULT_MARKETPLACE_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/promotions/pricing")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: PricingResponse | null) => {
        if (payload?.settings) setSettings(payload.settings);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/super-admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "marketplace_pricing", value: settings }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setMessage(payload.error ?? "Unable to save pricing.");
        return;
      }
      setMessage("Pricing saved. Changes apply immediately — no deploy required.");
    } catch {
      setMessage("Unable to save pricing.");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  if (loading) {
    return (
      <>
        <SuperAdminPageHeader
          title="Pricing Manager"
          description="Edit Boost, Showcase, and Business pricing without code changes."
        />
        <Card padding="md">
          <p className="text-sm text-text-secondary">Loading marketplace pricing…</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <SuperAdminPageHeader
        title="Pricing Manager"
        description="Configure Boost, Showcase, Promotion, and Business plan pricing."
      />

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <Card padding="md" className="flex flex-col gap-ds-4">
          <h2 className="text-base font-semibold text-text-primary">Boost</h2>
          {settings.boost.map((tier, index) => (
            <label key={tier.id} className="flex flex-col gap-ds-1">
              <span className="text-sm font-medium text-text-primary">{tier.label}</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={centsToPounds(tier.priceCents)}
                onChange={(event) => {
                  const priceCents = poundsToCents(event.target.value);
                  setSettings((current) => ({
                    ...current,
                    boost: current.boost.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, priceCents } : entry,
                    ),
                  }));
                }}
                className="rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm"
              />
            </label>
          ))}
        </Card>

        <Card padding="md" className="flex flex-col gap-ds-4">
          <h2 className="text-base font-semibold text-text-primary">Showcase</h2>
          <label className="flex flex-col gap-ds-1">
            <span className="text-sm font-medium text-text-primary">Label</span>
            <input
              type="text"
              value={settings.showcase.label}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  showcase: { ...current.showcase, label: event.target.value },
                }))
              }
              className="rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-ds-1">
            <span className="text-sm font-medium text-text-primary">Duration (days)</span>
            <input
              type="number"
              min={1}
              value={settings.showcase.days}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  showcase: {
                    ...current.showcase,
                    days: Number.parseInt(event.target.value, 10) || 1,
                  },
                }))
              }
              className="rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-ds-1">
            <span className="text-sm font-medium text-text-primary">Price (£)</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={centsToPounds(settings.showcase.priceCents)}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  showcase: {
                    ...current.showcase,
                    priceCents: poundsToCents(event.target.value),
                  },
                }))
              }
              className="rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm"
            />
          </label>
        </Card>

        <Card padding="md" className="flex flex-col gap-ds-4 lg:col-span-2">
          <h2 className="text-base font-semibold text-text-primary">Business (future plans)</h2>
          <div className="grid gap-ds-4 sm:grid-cols-3">
            <label className="flex flex-col gap-ds-1">
              <span className="text-sm font-medium text-text-primary">Plan label</span>
              <input
                type="text"
                value={settings.business?.label ?? DEFAULT_MARKETPLACE_PRICING.business!.label}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    business: {
                      ...(current.business ?? DEFAULT_MARKETPLACE_PRICING.business!),
                      label: event.target.value,
                    },
                  }))
                }
                className="rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-ds-1">
              <span className="text-sm font-medium text-text-primary">Price (£)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={centsToPounds(
                  settings.business?.priceCents ?? DEFAULT_MARKETPLACE_PRICING.business!.priceCents,
                )}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    business: {
                      ...(current.business ?? DEFAULT_MARKETPLACE_PRICING.business!),
                      priceCents: poundsToCents(event.target.value),
                    },
                  }))
                }
                className="rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-ds-1">
              <span className="text-sm font-medium text-text-primary">Interval</span>
              <select
                value={settings.business?.interval ?? "month"}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    business: {
                      ...(current.business ?? DEFAULT_MARKETPLACE_PRICING.business!),
                      interval: event.target.value as "month" | "year",
                    },
                  }))
                }
                className="rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </label>
          </div>
        </Card>
      </div>

      <div className="mt-ds-4 flex flex-wrap items-center gap-ds-3">
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save pricing"}
        </Button>
        {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
      </div>
    </>
  );
}
