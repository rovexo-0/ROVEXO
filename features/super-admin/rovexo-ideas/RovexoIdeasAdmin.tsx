"use client";

import { useState, useTransition } from "react";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium/EnterpriseAdminShell";
import { Card } from "@/components/ui/Card";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import {
  ROVEXO_IDEA_STATUSES,
  ROVEXO_IDEA_STATUS_LABELS,
  type RovexoIdeaStatus,
  type RovexoIdeaWithUser,
} from "@/lib/rovexo-ideas/types";

type RovexoIdeasAdminProps = {
  initialIdeas: RovexoIdeaWithUser[];
};

export function RovexoIdeasAdmin({ initialIdeas }: RovexoIdeasAdminProps) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RovexoIdeaStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialIdeas[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadIdeas = (nextQuery = query, nextStatus = status) => {
    startTransition(async () => {
      const params = new URLSearchParams();
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      if (nextStatus !== "all") params.set("status", nextStatus);

      const response = await fetch(`/api/super-admin/rovexo-ideas?${params.toString()}`);
      const payload = (await response.json()) as { ideas?: RovexoIdeaWithUser[]; error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to load suggestions.");
        return;
      }
      setIdeas(payload.ideas ?? []);
      setError(null);
    });
  };

  const selected = ideas.find((idea) => idea.id === selectedId) ?? ideas[0] ?? null;

  const updateStatus = (id: string, nextStatus: RovexoIdeaStatus) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/rovexo-ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (!response.ok) {
        setError("Unable to update status.");
        return;
      }
      loadIdeas();
    });
  };

  return (
    <EnterpriseAdminShell
      moduleId="rovexo-ideas"
      eyebrow="ROVEXO Ideas"
      title="User suggestions"
      description="Private user suggestions — search, filter, and update status."
      stateTabs={[{ id: "suggestions", label: "Suggestions" }]}
      activeTab="suggestions"
      onTabChange={() => undefined}
      isPending={isPending}
      message={error}
    >
      <div className="grid gap-ds-4 lg:grid-cols-[320px_1fr]">
        <Card padding="md" className="space-y-ds-3">
          <input
            type="search"
            placeholder="Search suggestions…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") loadIdeas(query, status);
            }}
            className="w-full rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
          />
          <select
            value={status}
            onChange={(event) => {
              const next = event.target.value as RovexoIdeaStatus | "all";
              setStatus(next);
              loadIdeas(query, next);
            }}
            className="w-full rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
          >
            <option value="all">All statuses</option>
            {ROVEXO_IDEA_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ROVEXO_IDEA_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={cn("text-sm font-medium text-primary", focusRing)}
            disabled={isPending}
            onClick={() => loadIdeas()}
          >
            Refresh
          </button>

          <div className="max-h-[60vh] space-y-ds-2 overflow-y-auto">
            {ideas.length === 0 ? (
              <p className="text-sm text-text-secondary">No suggestions yet.</p>
            ) : (
              ideas.map((idea) => (
                <button
                  key={idea.id}
                  type="button"
                  className={cn(
                    "w-full rounded-ds-lg border px-ds-3 py-ds-2 text-left",
                    selected?.id === idea.id ? "border-primary bg-primary/5" : "border-border",
                    focusRing,
                  )}
                  onClick={() => setSelectedId(idea.id)}
                >
                  <p className="truncate text-sm font-semibold text-text-primary">{idea.subject}</p>
                  <p className="text-xs text-text-secondary">
                    {ROVEXO_IDEA_STATUS_LABELS[idea.status]} · {idea.userEmail ?? "Unknown"}
                  </p>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card padding="lg">
          {error ? <p className="mb-ds-3 text-sm text-danger">{error}</p> : null}
          {selected ? (
            <div className="space-y-ds-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{selected.subject}</h2>
                <p className="mt-ds-1 text-sm text-text-secondary">
                  {selected.userName ?? "ROVEXO user"} · {selected.userEmail ?? "—"} ·{" "}
                  {new Date(selected.createdAt).toLocaleString("en-GB")}
                </p>
              </div>

              <p className="whitespace-pre-wrap text-sm text-text-primary">{selected.body}</p>

              {selected.screenshotUrl ? (
                <a
                  href={selected.screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-medium text-primary"
                >
                  View screenshot
                </a>
              ) : null}

              <div className="flex flex-wrap items-center gap-ds-2">
                <label htmlFor="idea-status" className="text-sm font-medium">
                  Status
                </label>
                <select
                  id="idea-status"
                  value={selected.status}
                  disabled={isPending}
                  onChange={(event) =>
                    updateStatus(selected.id, event.target.value as RovexoIdeaStatus)
                  }
                  className="rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
                >
                  {ROVEXO_IDEA_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {ROVEXO_IDEA_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Select a suggestion to review.</p>
          )}
        </Card>
      </div>
    </EnterpriseAdminShell>
  );
}
