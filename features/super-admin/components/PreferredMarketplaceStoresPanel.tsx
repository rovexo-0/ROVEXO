"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PreferredMarketplaceStoreConfig } from "@/lib/preferred-marketplace-stores/preferred-marketplace-stores-engine-v1";
import { PREFERRED_MARKETPLACE_STORES_ENGINE_V1 } from "@/lib/preferred-marketplace-stores/preferred-marketplace-stores-engine-v1";

type FormState = {
  id?: string;
  sellerEmail: string;
  enabled: boolean;
  homepageVisibility: boolean;
  promotionPriority: number;
  minPosition: number;
  maxPosition: number;
  startAt: string;
  endAt: string;
  maxSimultaneousListings: number;
};

const emptyForm = (): FormState => ({
  sellerEmail: "",
  enabled: true,
  homepageVisibility: true,
  promotionPriority: PREFERRED_MARKETPLACE_STORES_ENGINE_V1.defaults.promotionPriority,
  minPosition: PREFERRED_MARKETPLACE_STORES_ENGINE_V1.defaults.minPosition,
  maxPosition: PREFERRED_MARKETPLACE_STORES_ENGINE_V1.defaults.maxPosition,
  startAt: "",
  endAt: "",
  maxSimultaneousListings: PREFERRED_MARKETPLACE_STORES_ENGINE_V1.defaults.maxSimultaneousListings,
});

export function PreferredMarketplaceStoresPanel() {
  const [stores, setStores] = useState<PreferredMarketplaceStoreConfig[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/super-admin/preferred-marketplace-stores");
    const payload = (await response.json()) as { stores?: PreferredMarketplaceStoreConfig[] };
    setStores(payload.stores ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/super-admin/preferred-marketplace-stores")
      .then((response) => response.json())
      .then((payload: { stores?: PreferredMarketplaceStoreConfig[] }) => {
        if (!cancelled) setStores(payload.stores ?? []);
      })
      .catch(() => {
        if (!cancelled) setStores([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/super-admin/preferred-marketplace-stores", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          sellerEmail: form.sellerEmail.trim().toLowerCase(),
          enabled: form.enabled,
          homepageVisibility: form.homepageVisibility,
          promotionPriority: form.promotionPriority,
          minPosition: form.minPosition,
          maxPosition: form.maxPosition,
          startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
          endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
          maxSimultaneousListings: form.maxSimultaneousListings,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? "Unable to save preferred store.");
        return;
      }
      setForm(emptyForm());
      setMessage("Preferred store saved.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/super-admin/preferred-marketplace-stores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        setMessage("Unable to remove preferred store.");
        return;
      }
      setMessage("Preferred store removed.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  function edit(store: PreferredMarketplaceStoreConfig) {
    setForm({
      id: store.id,
      sellerEmail: store.sellerEmail ?? "",
      enabled: store.enabled,
      homepageVisibility: store.homepageVisibility,
      promotionPriority: store.promotionPriority,
      minPosition: store.minPosition,
      maxPosition: store.maxPosition,
      startAt: store.startAt ? store.startAt.slice(0, 16) : "",
      endAt: store.endAt ? store.endAt.slice(0, 16) : "",
      maxSimultaneousListings: store.maxSimultaneousListings,
    });
  }

  return (
    <div className="space-y-ds-4" data-preferred-marketplace-stores={PREFERRED_MARKETPLACE_STORES_ENGINE_V1.version}>
      <Card padding="md" className="bg-white">
        <h3 className="font-semibold">Preferred Marketplace Stores</h3>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Preferred stores are normal sellers with homepage slot privileges. Buyers never see Admin,
          Platform, or Official labels.
        </p>

        <div className="mt-ds-4 grid gap-ds-3 md:grid-cols-2">
          <label className="text-sm">
            Seller email
            <input
              className="rx-input mt-ds-1 w-full rounded-ds-md px-ds-3 py-ds-2"
              value={form.sellerEmail}
              onChange={(event) => setForm((current) => ({ ...current, sellerEmail: event.target.value }))}
              placeholder="seller@example.com"
            />
          </label>
          <label className="text-sm">
            Promotion priority
            <input
              type="number"
              className="rx-input mt-ds-1 w-full rounded-ds-md px-ds-3 py-ds-2"
              value={form.promotionPriority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  promotionPriority: Number(event.target.value) || 0,
                }))
              }
            />
          </label>
          <label className="text-sm">
            Minimum position
            <input
              type="number"
              min={1}
              className="rx-input mt-ds-1 w-full rounded-ds-md px-ds-3 py-ds-2"
              value={form.minPosition}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  minPosition: Number(event.target.value) || 1,
                }))
              }
            />
          </label>
          <label className="text-sm">
            Maximum position
            <input
              type="number"
              min={1}
              className="rx-input mt-ds-1 w-full rounded-ds-md px-ds-3 py-ds-2"
              value={form.maxPosition}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  maxPosition: Number(event.target.value) || 1,
                }))
              }
            />
          </label>
          <label className="text-sm">
            Start date
            <input
              type="datetime-local"
              className="rx-input mt-ds-1 w-full rounded-ds-md px-ds-3 py-ds-2"
              value={form.startAt}
              onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
            />
          </label>
          <label className="text-sm">
            End date
            <input
              type="datetime-local"
              className="rx-input mt-ds-1 w-full rounded-ds-md px-ds-3 py-ds-2"
              value={form.endAt}
              onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
            />
          </label>
          <label className="text-sm">
            Max simultaneous listings
            <input
              type="number"
              min={1}
              max={5}
              className="rx-input mt-ds-1 w-full rounded-ds-md px-ds-3 py-ds-2"
              value={form.maxSimultaneousListings}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  maxSimultaneousListings: Number(event.target.value) || 1,
                }))
              }
            />
          </label>
        </div>

        <div className="mt-ds-3 flex flex-wrap gap-ds-4 text-sm">
          <label className="inline-flex items-center gap-ds-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
            />
            Enable
          </label>
          <label className="inline-flex items-center gap-ds-2">
            <input
              type="checkbox"
              checked={form.homepageVisibility}
              onChange={(event) =>
                setForm((current) => ({ ...current, homepageVisibility: event.target.checked }))
              }
            />
            Homepage visibility
          </label>
        </div>

        <div className="mt-ds-4 flex gap-ds-3">
          <Button disabled={busy || !form.sellerEmail.trim()} onClick={() => void save()}>
            {form.id ? "Save Changes" : "Add Store"}
          </Button>
          {form.id ? (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setForm(emptyForm())}
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
        {message ? <p className="mt-ds-3 text-sm text-text-secondary">{message}</p> : null}
      </Card>

      <Card padding="md" className="bg-white">
        <h3 className="font-semibold">Configured stores</h3>
        {stores.length === 0 ? (
          <p className="mt-ds-2 text-sm text-text-secondary">No preferred stores configured.</p>
        ) : (
          <ul className="mt-ds-3 divide-y divide-border">
            {stores.map((store) => (
              <li key={store.id} className="flex flex-wrap items-center justify-between gap-ds-3 py-ds-3">
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-text-primary">
                    {store.sellerName || store.sellerUsername || store.sellerEmail || store.sellerId}
                  </p>
                  <p className="text-text-secondary">
                    {store.sellerEmail} · priority {store.promotionPriority} · positions{" "}
                    {store.minPosition}–{store.maxPosition} ·{" "}
                    {store.enabled && store.homepageVisibility ? "active" : "disabled"}
                  </p>
                </div>
                <div className="flex gap-ds-2">
                  <Button variant="ghost" disabled={busy} onClick={() => edit(store)}>
                    Edit
                  </Button>
                  <Button variant="ghost" disabled={busy} onClick={() => void remove(store.id)}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
