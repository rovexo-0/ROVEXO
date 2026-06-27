"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SettingToggle } from "@/features/settings/components/SettingToggle";
import type { AiOperationsSettings } from "@/lib/super-admin/operations/types";

type AiSelfHealingSectionProps = {
  settings: AiOperationsSettings;
  onUpdated: (settings: AiOperationsSettings) => void;
};

const LOW_RISK_EXAMPLES = [
  "Restart cache",
  "Clear cache",
  "Restart workers",
  "Refresh indexes",
  "Reconnect services",
];

const NEVER_RULES = [
  "Never modify production database",
  "Never delete files automatically",
  "Never deploy automatically",
];

export function AiSelfHealingSection({ settings, onUpdated }: AiSelfHealingSectionProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleAutoRepair(enabled: boolean) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/super-admin/operations/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRepairEnabled: enabled }),
      });
      const payload = (await response.json()) as { settings?: AiOperationsSettings; error?: string };
      if (!response.ok || !payload.settings) {
        throw new Error(payload.error ?? "Unable to update settings.");
      }
      onUpdated(payload.settings);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ai-ops-section">
      <h2 className="text-lg font-semibold text-text-primary">Self Healing</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">
        When enabled, AI may automatically repair only low-risk operational issues.
      </p>

      <Card padding="none" className="rx-surface-card mt-ds-4 overflow-hidden border border-border/80">
        <SettingToggle
          id="ai-auto-repair"
          label="Enable AI Auto Repair"
          description="Applies only to low-risk cache, worker, and reconnect operations."
          checked={settings.autoRepairEnabled}
          disabled={saving}
          onChange={(checked) => void toggleAutoRepair(checked)}
        />
      </Card>

      {error ? <p className="mt-ds-2 text-sm text-danger">{error}</p> : null}

      <div className="mt-ds-4 grid gap-ds-4 md:grid-cols-2">
        <Card padding="md" className="rx-glass border border-emerald-500/20">
          <p className="text-sm font-semibold text-text-primary">Low-risk auto repairs</p>
          <ul className="mt-ds-2 space-y-ds-1 text-sm text-text-secondary">
            {LOW_RISK_EXAMPLES.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>
        <Card padding="md" className="rx-glass border border-red-500/20">
          <p className="text-sm font-semibold text-text-primary">Hard limits</p>
          <ul className="mt-ds-2 space-y-ds-1 text-sm text-text-secondary">
            {NEVER_RULES.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
