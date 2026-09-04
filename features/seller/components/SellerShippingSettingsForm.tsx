"use client";

import { useEffect, useState } from "react";
import {
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalSection,
} from "@/src/components/canonical";
import type { SellerShippingSettingsInput } from "@/lib/account/schemas";
import {
  DEFAULT_SELLER_LABEL_SIZE,
  SELLER_LABEL_SIZE_LABELS,
  SELLER_LABEL_SIZES,
} from "@/lib/shipping/label-size";

const EMPTY: SellerShippingSettingsInput = {
  handlingTimeDays: 1,
  dispatchTimeDays: 1,
  baseShippingCost: 0,
  freeShippingThreshold: null,
  defaultCarrier: "Royal Mail",
  defaultLabelSize: DEFAULT_SELLER_LABEL_SIZE,
  shipsTo: "United Kingdom",
  localPickupEnabled: false,
  internationalShippingEnabled: false,
  returnPolicyDays: 14,
};

export function SellerShippingSettingsForm() {
  const [settings, setSettings] = useState<SellerShippingSettingsInput>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/account/seller-shipping", { credentials: "include" });
        if (!response.ok) throw new Error("Unable to load shipping settings.");
        const payload = (await response.json()) as { settings?: SellerShippingSettingsInput };
        if (!cancelled && payload.settings) {
          setSettings({ ...EMPTY, ...payload.settings });
        }
      } catch {
        if (!cancelled) setError("Unable to load shipping settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/account/seller-shipping", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const payload = (await response.json()) as {
        settings?: SellerShippingSettingsInput;
        error?: string;
      };
      if (!response.ok || !payload.settings) {
        throw new Error(payload.error ?? "Unable to save shipping settings.");
      }
      setSettings(payload.settings);
      setMessage("Shipping defaults saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save shipping settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <CanonicalSection title="Shipping defaults">
        <CanonicalCard variant="medium">
          <CanonicalInfoBlock variant="description">Loading…</CanonicalInfoBlock>
        </CanonicalCard>
      </CanonicalSection>
    );
  }

  return (
    <CanonicalSection title="Shipping defaults">
      <CanonicalCard variant="medium">
        <CanonicalInfoBlock variant="description">
          Saved once and reused for labels, quotes and tracking. ROVEXO still creates labels per
          order.
        </CanonicalInfoBlock>
        <form className="seller-shipping-form" onSubmit={(event) => void onSave(event)}>
          <label>
            Handling time (days)
            <input
              type="number"
              min={0}
              max={30}
              value={settings.handlingTimeDays}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  handlingTimeDays: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Dispatch time (days)
            <input
              type="number"
              min={0}
              max={30}
              value={settings.dispatchTimeDays}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  dispatchTimeDays: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Base shipping cost (£)
            <input
              type="number"
              min={0}
              step="0.01"
              value={settings.baseShippingCost}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  baseShippingCost: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Free shipping threshold (£)
            <input
              type="number"
              min={0}
              step="0.01"
              value={settings.freeShippingThreshold ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  freeShippingThreshold:
                    event.target.value === "" ? null : Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Default carrier
            <input
              type="text"
              value={settings.defaultCarrier}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, defaultCarrier: event.target.value }))
              }
            />
          </label>
          <label>
            Default label size
            <select
              value={settings.defaultLabelSize}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  defaultLabelSize: event.target.value as (typeof SELLER_LABEL_SIZES)[number],
                }))
              }
            >
              {SELLER_LABEL_SIZES.map((size) => (
                <option key={size} value={size}>
                  {SELLER_LABEL_SIZE_LABELS[size]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ships to
            <input
              type="text"
              value={settings.shipsTo}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, shipsTo: event.target.value }))
              }
            />
          </label>
          <label>
            Return policy (days)
            <input
              type="number"
              min={0}
              max={90}
              value={settings.returnPolicyDays}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  returnPolicyDays: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="seller-shipping-form__check">
            <input
              type="checkbox"
              checked={settings.localPickupEnabled}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  localPickupEnabled: event.target.checked,
                }))
              }
            />
            Local pickup enabled
          </label>
          <label className="seller-shipping-form__check">
            <input
              type="checkbox"
              checked={settings.internationalShippingEnabled}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  internationalShippingEnabled: event.target.checked,
                }))
              }
            />
            International shipping enabled
          </label>
          {error ? <p className="seller-shipping-form__error">{error}</p> : null}
          {message ? <p className="seller-shipping-form__ok">{message}</p> : null}
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Save shipping defaults"}
          </button>
        </form>
      </CanonicalCard>
      <style jsx>{`
        .seller-shipping-form {
          display: grid;
          gap: 12px;
          margin-top: 12px;
        }
        .seller-shipping-form label {
          display: grid;
          gap: 6px;
          font-size: 14px;
          color: #111;
        }
        .seller-shipping-form input,
        .seller-shipping-form select {
          height: 44px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0 12px;
          font: inherit;
        }
        .seller-shipping-form__check {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .seller-shipping-form__check input {
          width: 18px;
          height: 18px;
        }
        .seller-shipping-form__error {
          color: #b91c1c;
          margin: 0;
        }
        .seller-shipping-form__ok {
          color: #047857;
          margin: 0;
        }
      `}</style>
    </CanonicalSection>
  );
}
