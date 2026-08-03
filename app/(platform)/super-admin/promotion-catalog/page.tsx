"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import {
  DEFAULT_PROMOTION_CATALOG,
  type PromotionCatalogConfig,
  type PromotionCatalogEntry,
  type PromotionCatalogId,
  type PromotionTrustItem,
} from "@/lib/promotions/catalog";

type CatalogResponse = {
  config: PromotionCatalogConfig;
};

const CATALOG_IDS: PromotionCatalogId[] = [
  "bump",
  "featured",
  "boost",
  "premium",
  "store_featured",
];

function centsToPounds(cents: number): string {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

function poundsToCents(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

function updateEntry(
  config: PromotionCatalogConfig,
  id: PromotionCatalogId,
  patch: Partial<PromotionCatalogEntry>,
): PromotionCatalogConfig {
  return {
    ...config,
    entries: config.entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
  };
}

function updateTrustItem(
  config: PromotionCatalogConfig,
  id: string,
  patch: Partial<PromotionTrustItem>,
): PromotionCatalogConfig {
  return {
    ...config,
    trustItems: config.trustItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  };
}

export default function SuperAdminPromotionCatalogPage() {
  const [config, setConfig] = useState<PromotionCatalogConfig>(DEFAULT_PROMOTION_CATALOG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/promotions/catalog?raw=1")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: CatalogResponse | null) => {
        if (payload?.config) {
          setConfig({
            ...DEFAULT_PROMOTION_CATALOG,
            ...payload.config,
            entries: DEFAULT_PROMOTION_CATALOG.entries.map((defaultEntry) => {
              const saved = payload.config.entries.find((entry) => entry.id === defaultEntry.id);
              return saved ? { ...defaultEntry, ...saved } : defaultEntry;
            }),
            trustItems: DEFAULT_PROMOTION_CATALOG.trustItems.map((defaultItem) => {
              const saved = payload.config.trustItems.find((item) => item.id === defaultItem.id);
              return saved ? { ...defaultItem, ...saved } : defaultItem;
            }),
          });
        }
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
        body: JSON.stringify({ key: "promotion_catalog_v1", value: config }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setMessage(payload.error ?? "Unable to save promotion catalog.");
        return;
      }
      setMessage("Promotion catalog saved. Changes apply immediately.");
    } catch {
      setMessage("Unable to save promotion catalog.");
    } finally {
      setSaving(false);
    }
  }, [config]);

  if (loading) {
    return (
      <>
        <SuperAdminPageHeader
          title="Promotion Catalog"
          description="Edit promotion cards shown on the seller promotions page."
        />
        <Card padding="md">
          <p className="text-sm text-text-secondary">Loading promotion catalog…</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <SuperAdminPageHeader
        title="Promotion Catalog"
        description="Enable, price, and configure Bump, Featured, Boost, Premium, and Store Featured cards."
        actions={
          <div className="flex flex-wrap gap-ds-2">
            <Link href="/seller/promotions" className="text-sm font-semibold text-primary">
              Preview page
            </Link>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save catalog"}
            </Button>
          </div>
        }
      />

      {message ? <p className="mb-ds-4 text-sm text-text-secondary">{message}</p> : null}

      <Card padding="md" className="mb-ds-4">
        <h2 className="text-base font-semibold text-text-primary">Page copy</h2>
        <div className="mt-ds-4 grid gap-ds-3 md:grid-cols-2">
          <label className="flex flex-col gap-ds-1">
            <span className="text-sm font-medium">Title</span>
            <input
              className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
              value={config.pageTitle}
              onChange={(event) => setConfig((current) => ({ ...current, pageTitle: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-ds-1">
            <span className="text-sm font-medium">How it works label</span>
            <input
              className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
              value={config.howItWorksLabel}
              onChange={(event) =>
                setConfig((current) => ({ ...current, howItWorksLabel: event.target.value }))
              }
            />
          </label>
          <label className="flex flex-col gap-ds-1 md:col-span-2">
            <span className="text-sm font-medium">Subtitle</span>
            <textarea
              className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
              rows={2}
              value={config.pageSubtitle}
              onChange={(event) => setConfig((current) => ({ ...current, pageSubtitle: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-ds-1 md:col-span-2">
            <span className="text-sm font-medium">How it works link</span>
            <input
              className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
              value={config.howItWorksHref}
              onChange={(event) =>
                setConfig((current) => ({ ...current, howItWorksHref: event.target.value }))
              }
            />
          </label>
        </div>
      </Card>

      <div className="grid gap-ds-4">
        {CATALOG_IDS.map((id) => {
          const entry = config.entries.find((item) => item.id === id);
          if (!entry) return null;

          return (
            <Card key={id} padding="md">
              <div className="flex flex-wrap items-center justify-between gap-ds-2">
                <h2 className="text-base font-semibold text-text-primary">{entry.title}</h2>
                <div className="flex flex-wrap gap-ds-3 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={entry.enabled}
                      onChange={(event) =>
                        setConfig((current) => updateEntry(current, id, { enabled: event.target.checked }))
                      }
                    />
                    Enabled
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={entry.visible}
                      onChange={(event) =>
                        setConfig((current) => updateEntry(current, id, { visible: event.target.checked }))
                      }
                    />
                    Visible
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={entry.recommended}
                      onChange={(event) =>
                        setConfig((current) =>
                          updateEntry(current, id, { recommended: event.target.checked }),
                        )
                      }
                    />
                    Recommended CTA
                  </label>
                </div>
              </div>

              <div className="mt-ds-4 grid gap-ds-3 md:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-ds-1">
                  <span className="text-sm font-medium">Title</span>
                  <input
                    className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                    value={entry.title}
                    onChange={(event) =>
                      setConfig((current) => updateEntry(current, id, { title: event.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-ds-1">
                  <span className="text-sm font-medium">Priority</span>
                  <input
                    type="number"
                    min={1}
                    className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                    value={entry.priority}
                    onChange={(event) =>
                      setConfig((current) =>
                        updateEntry(current, id, { priority: Number(event.target.value) || 1 }),
                      )
                    }
                  />
                </label>
                <label className="flex flex-col gap-ds-1">
                  <span className="text-sm font-medium">Badge</span>
                  <input
                    className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                    value={entry.badge ?? ""}
                    onChange={(event) =>
                      setConfig((current) =>
                        updateEntry(current, id, { badge: event.target.value || null }),
                      )
                    }
                  />
                </label>
                <label className="flex flex-col gap-ds-1 md:col-span-2 lg:col-span-3">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                    rows={2}
                    value={entry.description}
                    onChange={(event) =>
                      setConfig((current) => updateEntry(current, id, { description: event.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-ds-1 md:col-span-2 lg:col-span-3">
                  <span className="text-sm font-medium">Benefits (one per line)</span>
                  <textarea
                    className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                    rows={3}
                    value={entry.benefits.join("\n")}
                    onChange={(event) =>
                      setConfig((current) =>
                        updateEntry(current, id, {
                          benefits: event.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean),
                        }),
                      )
                    }
                  />
                </label>
                <label className="flex flex-col gap-ds-1">
                  <span className="text-sm font-medium">Pricing mode</span>
                  <select
                    className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                    value={entry.pricingMode}
                    onChange={(event) =>
                      setConfig((current) =>
                        updateEntry(current, id, {
                          pricingMode: event.target.value as PromotionCatalogEntry["pricingMode"],
                        }),
                      )
                    }
                  >
                    <option value="fixed">Fixed price</option>
                    <option value="marketplace_boost_tier">Marketplace boost tier</option>
                    <option value="marketplace_showcase">Marketplace showcase</option>
                  </select>
                </label>
                <label className="flex flex-col gap-ds-1">
                  <span className="text-sm font-medium">Price (£)</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                    value={centsToPounds(entry.priceCents)}
                    onChange={(event) =>
                      setConfig((current) =>
                        updateEntry(current, id, { priceCents: poundsToCents(event.target.value) }),
                      )
                    }
                  />
                </label>
                <label className="flex flex-col gap-ds-1">
                  <span className="text-sm font-medium">Duration label</span>
                  <input
                    className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                    value={entry.durationLabel}
                    onChange={(event) =>
                      setConfig((current) =>
                        updateEntry(current, id, { durationLabel: event.target.value }),
                      )
                    }
                  />
                </label>
                <label className="flex flex-col gap-ds-1">
                  <span className="text-sm font-medium">CTA label</span>
                  <input
                    className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                    value={entry.ctaLabel}
                    onChange={(event) =>
                      setConfig((current) => updateEntry(current, id, { ctaLabel: event.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-ds-1">
                  <span className="text-sm font-medium">Theme</span>
                  <select
                    className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                    value={entry.theme}
                    onChange={(event) =>
                      setConfig((current) =>
                        updateEntry(current, id, {
                          theme: event.target.value as PromotionCatalogEntry["theme"],
                        }),
                      )
                    }
                  >
                    <option value="green">Green</option>
                    <option value="gold">Gold</option>
                    <option value="purple">Purple</option>
                    <option value="pink">Pink</option>
                    <option value="blue">Blue</option>
                  </select>
                </label>
              </div>
            </Card>
          );
        })}
      </div>

      <Card padding="md" className="mt-ds-4">
        <h2 className="text-base font-semibold text-text-primary">Trust footer</h2>
        <div className="mt-ds-4 grid gap-ds-3 md:grid-cols-2">
          {config.trustItems.map((item) => (
            <div key={item.id} className="rounded-ds-md border border-border p-ds-3">
              <label className="mb-ds-2 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(event) =>
                    setConfig((current) =>
                      updateTrustItem(current, item.id, { enabled: event.target.checked }),
                    )
                  }
                />
                Enabled
              </label>
              <label className="flex flex-col gap-ds-1">
                <span className="text-sm font-medium">Title</span>
                <input
                  className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                  value={item.title}
                  onChange={(event) =>
                    setConfig((current) =>
                      updateTrustItem(current, item.id, { title: event.target.value }),
                    )
                  }
                />
              </label>
              <label className="mt-ds-2 flex flex-col gap-ds-1">
                <span className="text-sm font-medium">Description</span>
                <input
                  className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
                  value={item.description}
                  onChange={(event) =>
                    setConfig((current) =>
                      updateTrustItem(current, item.id, { description: event.target.value }),
                    )
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
