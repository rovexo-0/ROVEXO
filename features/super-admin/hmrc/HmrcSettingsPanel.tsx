"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  HMRC_ENGINE_V1,
  resolveHmrcEngineConfig,
  type HmrcEngineConfig,
} from "@/lib/compliance/hmrc-engine-v1";

const SETTINGS_KEY = HMRC_ENGINE_V1.platformSettingsKey;

export function HmrcSettingsPanel() {
  const [config, setConfig] = useState<HmrcEngineConfig>(resolveHmrcEngineConfig(null));
  const [warningText, setWarningText] = useState(
    resolveHmrcEngineConfig(null).warningPercents.join(", "),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/super-admin/settings")
      .then((response) => response.json())
      .then((payload: { settings?: Record<string, unknown> }) => {
        const raw = payload.settings?.[SETTINGS_KEY];
        const next = resolveHmrcEngineConfig(raw);
        setConfig(next);
        setWarningText(next.warningPercents.join(", "));
      })
      .catch(() => {
        setMessage("Unable to load HMRC settings.");
      });
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);

    const percents = warningText
      .split(/[,\s]+/)
      .map((part) => Number(part.trim()))
      .filter((n) => Number.isFinite(n) && n > 0 && n < 100);

    const value: HmrcEngineConfig = {
      thresholdGbp: Math.max(1, Number(config.thresholdGbp) || HMRC_ENGINE_V1.defaultThresholdGbp),
      warningPercents: percents.length ? [...new Set(percents)].sort((a, b) => a - b) : [...HMRC_ENGINE_V1.defaultWarningPercents],
      reportingRules: { ...config.reportingRules },
      taxYearMode: "april_6",
    };

    const response = await fetch("/api/super-admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: SETTINGS_KEY, value }),
    });

    setSaving(false);
    if (!response.ok) {
      setMessage("Unable to save HMRC settings.");
      return;
    }
    setConfig(value);
    setWarningText(value.warningPercents.join(", "));
    setMessage("HMRC settings saved.");
  }

  return (
    <div className="space-y-ds-4" data-hmrc-settings="v1.0">
      <Card padding="md" className="bg-white">
        <h3 className="font-semibold">HMRC reporting threshold</h3>
        <p className="mt-ds-1 text-sm text-slate-600">
          Gross seller sales in the UK tax year at or above this amount trigger reporting required.
        </p>
        <label className="mt-ds-3 block text-sm font-medium" htmlFor="hmrc-threshold">
          Threshold (GBP)
        </label>
        <input
          id="hmrc-threshold"
          type="number"
          min={1}
          step={1}
          value={config.thresholdGbp}
          onChange={(event) =>
            setConfig((current) => ({
              ...current,
              thresholdGbp: Number(event.target.value),
            }))
          }
          className="rx-input mt-ds-1 w-full max-w-xs rounded-ds-md px-ds-3 py-ds-2 text-sm"
        />
      </Card>

      <Card padding="md" className="bg-white">
        <h3 className="font-semibold">Warning percentages</h3>
        <p className="mt-ds-1 text-sm text-slate-600">
          Sellers are notified when sales reach each percentage of the threshold (comma-separated).
        </p>
        <label className="mt-ds-3 block text-sm font-medium" htmlFor="hmrc-warnings">
          Warning % list
        </label>
        <input
          id="hmrc-warnings"
          value={warningText}
          onChange={(event) => setWarningText(event.target.value)}
          placeholder="50, 75, 90"
          className="rx-input mt-ds-1 w-full max-w-md rounded-ds-md px-ds-3 py-ds-2 text-sm"
        />
      </Card>

      <Card padding="md" className="bg-white">
        <h3 className="font-semibold">Reporting rules</h3>
        <div className="mt-ds-3 space-y-ds-2 text-sm">
          <label className="flex items-center gap-ds-2">
            <input
              type="checkbox"
              checked={config.reportingRules.reportWhenAtOrAboveThreshold}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  reportingRules: {
                    ...current.reportingRules,
                    reportWhenAtOrAboveThreshold: event.target.checked,
                  },
                }))
              }
            />
            Mark reporting required at or above threshold
          </label>
          <label className="flex items-center gap-ds-2">
            <input
              type="checkbox"
              checked={config.reportingRules.notifyOnWarningPercents}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  reportingRules: {
                    ...current.reportingRules,
                    notifyOnWarningPercents: event.target.checked,
                  },
                }))
              }
            />
            Send threshold warning notifications
          </label>
          <label className="flex items-center gap-ds-2">
            <input
              type="checkbox"
              checked={config.reportingRules.preferCompletedOrders}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  reportingRules: {
                    ...current.reportingRules,
                    preferCompletedOrders: event.target.checked,
                  },
                }))
              }
            />
            Prefer completed orders for counters (fallback to wallet sales)
          </label>
        </div>
      </Card>

      <Card padding="md" className="bg-white">
        <h3 className="font-semibold">UK tax year</h3>
        <p className="mt-ds-1 text-sm text-slate-600">
          Official UK tax year window used for HMRC counters and documents.
        </p>
        <label className="mt-ds-3 flex items-center gap-ds-2 text-sm">
          <input type="radio" name="tax-year-mode" checked readOnly />
          6 April → 5 April (standard UK tax year)
        </label>
        <p className="mt-ds-2 text-xs text-slate-500">Mode: april_6 · locked for UK DAC7 / platform reporting.</p>
      </Card>

      <div className="flex flex-wrap items-center gap-ds-3">
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save HMRC settings"}
        </Button>
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      </div>
    </div>
  );
}
