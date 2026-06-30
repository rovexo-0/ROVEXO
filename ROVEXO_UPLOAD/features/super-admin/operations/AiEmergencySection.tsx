"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const EMERGENCY_ACTIONS = [
  { action: "restart_services", label: "Restart Services", icon: "🔄" },
  { action: "restart_queue", label: "Restart Queue", icon: "📬" },
  { action: "clear_cache", label: "Clear Cache", icon: "🧹" },
  { action: "reload_configuration", label: "Reload Configuration", icon: "⚙️" },
  { action: "maintenance_on", label: "Maintenance Mode", icon: "🚧" },
  { action: "maintenance_off", label: "Disable Maintenance", icon: "✅" },
  { action: "emergency_diagnostics", label: "Emergency Diagnostics", icon: "🩺" },
] as const;

export function AiEmergencySection() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function runAction(action: (typeof EMERGENCY_ACTIONS)[number]["action"]) {
    const label = EMERGENCY_ACTIONS.find((item) => item.action === action)?.label ?? action;
    const confirmed = window.confirm(`Confirm emergency action: ${label}?`);
    if (!confirmed) return;

    setLoading(action);
    setMessage(null);
    try {
      const response = await fetch("/api/super-admin/operations/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Emergency action failed.");
      setMessage(payload.message ?? "Action completed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Emergency action failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="ai-ops-section">
      <h2 className="text-lg font-semibold text-text-primary">Emergency</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">
        High-impact operational controls. Every action requires confirmation.
      </p>

      {message ? <p className="mt-ds-3 text-sm text-primary">{message}</p> : null}

      <div className="mt-ds-4 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {EMERGENCY_ACTIONS.map((item) => (
          <Card
            key={item.action}
            padding="md"
            className="rx-surface-card border border-red-500/15 bg-gradient-to-br from-white/95 to-red-50/40 dark:from-slate-900/90 dark:to-red-950/20"
          >
            <div className="flex items-center gap-ds-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-ds-lg bg-red-500/10 text-xl">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              fullWidth
              className="mt-ds-3 border-red-500/30 text-red-700 hover:border-red-500 dark:text-red-300"
              disabled={loading !== null}
              onClick={() => void runAction(item.action)}
            >
              {loading === item.action ? "Running…" : "Execute"}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
