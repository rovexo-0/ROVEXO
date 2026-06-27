"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Recommendation } from "@/lib/super-admin/operations/types";

const DIFFICULTY_VARIANT: Record<Recommendation["difficulty"], "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

export function AiRecommendationsSection({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <section className="ai-ops-section">
      <h2 className="text-lg font-semibold text-text-primary">AI Recommendations</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">
        Optimization opportunities ranked by estimated impact and implementation effort.
      </p>

      <div className="mt-ds-4 grid gap-ds-3 lg:grid-cols-2">
        {recommendations.map((item) => (
          <Card key={item.id} padding="md" className="rx-surface-card border border-border/80">
            <div className="flex flex-wrap items-start justify-between gap-ds-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.category}</p>
                <h3 className="mt-ds-1 font-semibold text-text-primary">{item.title}</h3>
              </div>
              <Badge variant={DIFFICULTY_VARIANT[item.difficulty]}>{item.difficulty} effort</Badge>
            </div>
            <p className="mt-ds-2 text-sm text-text-secondary">{item.detail}</p>
            <div className="mt-ds-3 flex flex-wrap gap-ds-4 text-xs text-text-muted">
              <span>
                <span className="font-medium text-text-primary">Gain:</span> {item.estimatedGain}
              </span>
              <span>
                <span className="font-medium text-text-primary">Files:</span>{" "}
                {item.filesAffected.length > 0 ? item.filesAffected.join(", ") : "—"}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
