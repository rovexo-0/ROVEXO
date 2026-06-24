"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { AiOperationsSummary } from "@/lib/super-admin/operations/types";
import { SEVERITY_BADGE, SEVERITY_CARD } from "@/features/super-admin/operations/utils";

const CARDS: Array<{
  key: keyof AiOperationsSummary | "aiStatus";
  label: string;
  icon: string;
  format?: (value: AiOperationsSummary) => string;
}> = [
  { key: "platformHealth", label: "Platform Health", icon: "🩺", format: (s) => s.platformHealth.toUpperCase() },
  { key: "aiStatus", label: "AI Status", icon: "🤖", format: (s) => s.aiStatus.toUpperCase() },
  { key: "activeAlerts", label: "Active Alerts", icon: "🚨", format: (s) => String(s.activeAlerts) },
  { key: "autoRepairsToday", label: "Auto Repairs Today", icon: "🔧", format: (s) => String(s.autoRepairsToday) },
  { key: "criticalIssues", label: "Critical Issues", icon: "⛔", format: (s) => String(s.criticalIssues) },
  { key: "serverResponseMs", label: "Server Response", icon: "⚡", format: (s) => `${s.serverResponseMs}ms` },
  { key: "cpuPercent", label: "CPU", icon: "🖥️", format: (s) => `${s.cpuPercent}%` },
  { key: "memoryPercent", label: "Memory", icon: "🧠", format: (s) => `${s.memoryPercent}%` },
  { key: "storagePercent", label: "Storage", icon: "💾", format: (s) => `${s.storagePercent}%` },
];

export function AiOperationsSummaryCards({ summary }: { summary: AiOperationsSummary }) {
  return (
    <section className="grid gap-ds-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {CARDS.map((card) => {
        const isStatus = card.key === "platformHealth" || card.key === "aiStatus";
        const statusValue = card.key === "aiStatus" ? summary.aiStatus : summary.platformHealth;
        const display = card.format?.(summary) ?? String(summary[card.key as keyof AiOperationsSummary]);

        return (
          <Card
            key={card.label}
            padding="md"
            className={`premium-card ai-ops-card overflow-hidden border shadow-[0_12px_40px_rgba(15,23,42,0.08)] ${
              isStatus ? SEVERITY_CARD[statusValue] : "border-border/80 bg-white/90 dark:bg-slate-900/80"
            }`}
          >
            <div className="flex items-start justify-between gap-ds-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-ds-lg bg-primary/10 text-xl shadow-inner">
                {card.icon}
              </span>
              {isStatus ? (
                <Badge variant={SEVERITY_BADGE[statusValue]}>{display}</Badge>
              ) : null}
            </div>
            <p className="mt-ds-3 text-sm text-text-secondary">{card.label}</p>
            {!isStatus ? (
              <p className="mt-ds-1 text-2xl font-bold tracking-tight text-text-primary">{display}</p>
            ) : null}
          </Card>
        );
      })}
    </section>
  );
}
