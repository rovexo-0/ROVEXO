"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AutomationControls } from "@/lib/super-admin/insights";

const AUTOMATION_LABELS: Record<keyof AutomationControls, string> = {
  automaticBackups: "Automatic Backups",
  automaticHealthChecks: "Automatic Health Checks",
  automaticFraudDetection: "Automatic Fraud Detection",
  automaticCacheCleanup: "Automatic Cache Cleanup",
  automaticErrorRecovery: "Automatic Error Recovery",
  automaticNotifications: "Automatic Notifications",
};

const AUTOMATION_HINTS: Partial<Record<keyof AutomationControls, string>> = {
  automaticErrorRecovery:
    "Recovery runs only when platform automation rules and health checks allow it.",
};

export function SuperAdminAutomationPanel() {
  const [controls, setControls] = useState<AutomationControls | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/super-admin/settings")
      .then((response) => response.json())
      .then((payload: { settings?: Record<string, AutomationControls> }) => {
        const raw = payload.settings?.automation_controls;
        setControls(
          raw ?? {
            automaticBackups: true,
            automaticHealthChecks: true,
            automaticFraudDetection: true,
            automaticCacheCleanup: true,
            automaticErrorRecovery: false,
            automaticNotifications: true,
          },
        );
      });
  }, []);

  async function save(next: AutomationControls) {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/super-admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "automation_controls", value: next }),
    });
    setSaving(false);
    setMessage(response.ok ? "Automation controls saved." : "Unable to save automation controls.");
  }

  if (!controls) {
    return <p className="text-sm text-text-secondary">Loading automation controls…</p>;
  }

  return (
    <div className="space-y-ds-4">
      <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <h3 className="font-semibold">Automation controls</h3>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Toggle platform automations. Error recovery respects platform safety rules before executing.
        </p>
        <div className="mt-ds-4 space-y-ds-3">
          {(Object.keys(AUTOMATION_LABELS) as Array<keyof AutomationControls>).map((key) => (
            <label key={key} className="flex items-start gap-ds-3 rounded-ds-md border border-border px-ds-3 py-ds-3">
              <input
                type="checkbox"
                checked={controls[key]}
                onChange={(event) =>
                  setControls((current) => (current ? { ...current, [key]: event.target.checked } : current))
                }
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium text-text-primary">{AUTOMATION_LABELS[key]}</span>
                {AUTOMATION_HINTS[key] ? (
                  <span className="mt-ds-1 block text-xs text-text-secondary">{AUTOMATION_HINTS[key]}</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
        <Button className="mt-ds-4" disabled={saving} onClick={() => void save(controls)}>
          {saving ? "Saving…" : "Save automation controls"}
        </Button>
      </Card>
      {message ? <p className="text-sm font-medium text-primary">{message}</p> : null}
    </div>
  );
}
