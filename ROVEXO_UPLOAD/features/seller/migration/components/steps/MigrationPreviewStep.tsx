"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { MigrationPreviewItem } from "@/lib/seller/migration/types";

type MigrationPreviewStepProps = {
  items: MigrationPreviewItem[];
  platformLabel: string;
  methodLabel: string;
};

export function MigrationPreviewStep({ items, platformLabel, methodLabel }: MigrationPreviewStepProps) {
  return (
    <div className="flex flex-col gap-ds-3">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Preview import</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Review sample listings mapped from {platformLabel} via {methodLabel}. Final data comes from your
          source when connectors are live.
        </p>
      </div>
      <ul className="flex flex-col gap-ds-2" aria-label="Preview listings">
        {items.map((item) => (
          <li key={item.id}>
            <Card padding="sm" className="flex items-center gap-ds-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-ds-md bg-surface text-[10px] font-medium text-text-muted"
                aria-hidden
              >
                {item.imageLabel}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{item.title}</p>
                <p className="mt-ds-1 text-sm text-text-secondary">{item.price}</p>
                {item.note ? (
                  <p className="mt-ds-1 text-xs text-warning">{item.note}</p>
                ) : null}
              </div>
              <Badge variant={item.status === "warning" ? "warning" : "success"}>
                {item.status === "warning" ? "Review" : "Ready"}
              </Badge>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
