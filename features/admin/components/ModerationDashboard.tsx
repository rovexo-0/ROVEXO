"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ModerationDecision, ModerationQueueItem, ModerationRiskLevel } from "@/lib/moderation/types";
import { riskLevelLabel } from "@/lib/moderation/risk";

type AuditLog = {
  id: string;
  queue_id: string | null;
  action: string;
  decision: ModerationDecision | null;
  notes: string;
  created_at: string;
};

type ModerationDashboardProps = {
  initialQueue: ModerationQueueItem[];
  initialAuditLogs: AuditLog[];
};

const RISK_VARIANTS: Record<ModerationRiskLevel, "default" | "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "warning",
  critical: "danger",
};

const STATUS_VARIANTS: Record<
  ModerationQueueItem["status"],
  "default" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  approved: "success",
  warning: "warning",
  blocked: "danger",
  overridden: "default",
};

export function ModerationDashboard({
  initialQueue,
  initialAuditLogs,
}: ModerationDashboardProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [selectedId, setSelectedId] = useState<string | null>(initialQueue[0]?.id ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");

  const filtered = useMemo(() => {
    if (filter === "all") return queue;
    return queue.filter((item) => item.status === filter);
  }, [filter, queue]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/moderation");
    if (!response.ok) return;
    const payload = (await response.json()) as {
      queue: ModerationQueueItem[];
      auditLogs: AuditLog[];
    };
    setQueue(payload.queue);
    setAuditLogs(payload.auditLogs);
  }, []);

  const runAction = useCallback(
    async (id: string, action: "approve" | "warn" | "block" | "override", notes?: string) => {
      setBusyId(id);
      setMessage(null);

      try {
        const response = await fetch(`/api/admin/moderation/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            notes,
            overrideDecision: action === "override" ? "approved" : undefined,
          }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          setMessage(payload.error ?? "Action failed.");
          return;
        }

        await refresh();
        setMessage(`Moderation item ${action}d.`);
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  return (
    <div className="flex flex-col gap-ds-5">
      <div>
        <h2 className="text-xl font-semibold">AI Moderation</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Review automated decisions, override outcomes, and inspect audit history.
        </p>
      </div>

      <div className="grid gap-ds-4 sm:grid-cols-4">
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Pending review</p>
          <p className="mt-ds-1 text-2xl font-bold">
            {queue.filter((item) => item.status === "pending").length}
          </p>
        </Card>
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Warnings</p>
          <p className="mt-ds-1 text-2xl font-bold">
            {queue.filter((item) => item.status === "warning").length}
          </p>
        </Card>
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Blocked</p>
          <p className="mt-ds-1 text-2xl font-bold">
            {queue.filter((item) => item.status === "blocked").length}
          </p>
        </Card>
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">High / Critical</p>
          <p className="mt-ds-1 text-2xl font-bold">
            {queue.filter((item) => item.riskLevel === "high" || item.riskLevel === "critical").length}
          </p>
        </Card>
      </div>

      {message ? <p className="text-sm text-text-secondary">{message}</p> : null}

      <div className="flex flex-wrap gap-ds-2">
        {["all", "pending", "warning", "blocked", "overridden"].map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "primary" : "secondary"}
            onClick={() => setFilter(value)}
          >
            {value}
          </Button>
        ))}
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-border px-ds-4 py-ds-3">
            <h3 className="font-semibold">Review queue</h3>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`flex w-full items-start gap-ds-3 border-b border-border px-ds-4 py-ds-3 text-left ${
                  selected?.id === item.id ? "bg-surface-muted" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.summary || item.targetType}</p>
                  <p className="mt-ds-1 text-xs text-text-secondary">
                    {item.targetType} · {Math.round(item.confidence * 100)}% · Risk {item.riskScore}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-ds-1">
                  <Badge variant={RISK_VARIANTS[item.riskLevel]}>{riskLevelLabel(item.riskLevel)}</Badge>
                  <Badge variant={STATUS_VARIANTS[item.status]}>{item.status}</Badge>
                </div>
              </button>
            ))}
            {!filtered.length ? (
              <p className="px-ds-4 py-ds-6 text-sm text-text-secondary">No items in this queue.</p>
            ) : null}
          </div>
        </Card>

        <Card padding="lg" className="">
          {selected ? (
            <div className="flex flex-col gap-ds-4">
              <div>
                <Badge variant={STATUS_VARIANTS[selected.status]}>{selected.status}</Badge>
                <h3 className="mt-ds-2 text-lg font-semibold">{selected.summary}</h3>
                <p className="mt-ds-1 text-sm text-text-secondary">
                  Source: {selected.source} · Decision: {selected.decision} · Risk:{" "}
                  {riskLevelLabel(selected.riskLevel)} ({selected.riskScore})
                </p>
              </div>

              {selected.categories.length ? (
                <div className="flex flex-wrap gap-ds-2">
                  {selected.categories.map((category) => (
                    <Badge key={category} variant="default">
                      {category}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-ds-2">
                <Button
                  size="sm"
                  disabled={busyId === selected.id}
                  onClick={() => void runAction(selected.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === selected.id}
                  onClick={() => void runAction(selected.id, "warn")}
                >
                  Warn
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === selected.id}
                  onClick={() => void runAction(selected.id, "block")}
                >
                  Block
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === selected.id}
                  onClick={() => void runAction(selected.id, "override", "Manual override")}
                >
                  Override
                </Button>
              </div>

              <div>
                <h4 className="text-sm font-semibold">Audit log</h4>
                <ul className="mt-ds-2 space-y-ds-2">
                  {auditLogs
                    .filter((log) => log.queue_id === selected.id)
                    .slice(0, 8)
                    .map((log) => (
                      <li key={log.id} className="rounded-ds-md bg-surface-muted px-ds-3 py-ds-2 text-xs">
                        <span className="font-medium">{log.action}</span>
                        {log.notes ? ` — ${log.notes}` : ""}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Select a queue item to review.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
