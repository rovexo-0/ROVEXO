"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { LogEntry } from "@/lib/super-admin/operations/types";

const LOG_TABS: Array<{ id: string; label: string }> = [
  { id: "system", label: "System" },
  { id: "api", label: "API" },
  { id: "cron", label: "Cron" },
  { id: "email", label: "Email" },
  { id: "payment", label: "Payment" },
  { id: "search", label: "Search" },
  { id: "authentication", label: "Authentication" },
];

const LEVEL_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  info: "default",
  warn: "warning",
  warning: "warning",
  error: "danger",
  critical: "danger",
};

export function AiOperationsLogsSection({ logs }: { logs: Record<string, LogEntry[]> }) {
  const [activeTab, setActiveTab] = useState(LOG_TABS[0].id);
  const entries = logs[activeTab] ?? [];

  return (
    <section className="ai-ops-section">
      <h2 className="text-lg font-semibold text-text-primary">Logs</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">Recent platform events from the last 24 hours.</p>

      <div className="mt-ds-4 flex flex-wrap gap-ds-2">
        {LOG_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-ds-lg px-ds-3 py-ds-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-[var(--ds-glow-primary)]"
                : "bg-surface-muted text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card padding="none" className="rx-surface-card mt-ds-4 overflow-hidden border border-border/80">
        <div className="max-h-80 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="px-ds-4 py-ds-6 text-sm text-text-secondary">No logs in this category.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-start gap-ds-3 px-ds-4 py-ds-3">
                  <Badge variant={LEVEL_VARIANT[entry.level] ?? "default"}>{entry.level}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary">{entry.message}</p>
                    <p className="mt-ds-1 text-xs text-text-muted">
                      {new Date(entry.createdAt).toLocaleString()} · {entry.category}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </section>
  );
}
