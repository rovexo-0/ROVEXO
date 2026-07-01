"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { PageBack } from "@/components/navigation/PageBack";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StickyPageHeader } from "@/components/ui/StickyPageHeader";
import { MigrationBulkPublishPanel } from "@/features/seller/migration/components/MigrationBulkPublishPanel";
import type { DuplicateAction, MigrationJob, MigrationQueueItem } from "@/lib/seller/migration/types";

const CATEGORY_SUGGESTIONS = [
  "electronics",
  "fashion",
  "home-garden",
  "sports",
  "toys",
  "vehicles",
  "collectibles",
  "other",
] as const;

type MigrationJobDetailPageProps = {
  jobId: string;
  initialJob: MigrationJob;
  initialItems: MigrationQueueItem[];
};

export function MigrationJobDetailPage({
  jobId,
  initialJob,
  initialItems,
}: MigrationJobDetailPageProps) {
  const [job, setJob] = useState(initialJob);
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [jobRes, itemsRes] = await Promise.all([
        fetch(`/api/seller/migration/${jobId}`, { cache: "no-store" }),
        fetch(`/api/seller/migration/${jobId}/items`, { cache: "no-store" }),
      ]);
      if (!jobRes.ok) throw new Error("Migration job not found.");
      const jobPayload = (await jobRes.json()) as { job: MigrationJob };
      setJob(jobPayload.job);
      if (itemsRes.ok) {
        const itemsPayload = (await itemsRes.json()) as { items: MigrationQueueItem[] };
        setItems(itemsPayload.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load migration job.");
    }
  }, [jobId]);

  const updateItem = async (
    itemId: string,
    patch: { categorySlug?: string; duplicateAction?: DuplicateAction; selected?: boolean },
  ) => {
    const response = await fetch(`/api/seller/migration/${jobId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (response.ok) {
      await reload();
    }
  };

  if (error) {
    return (
      <BetaAppShell showBottomNav={false}>
        <main className="mx-auto w-full max-w-2xl bg-background px-5 py-5">
          <Card padding="lg" className="border-error/30 bg-error/5">
            <p className="text-sm text-error">{error}</p>
            <Link href="/seller/migration" className="mt-ds-3 inline-block text-sm text-primary underline">
              Back to Migration Center
            </Link>
          </Card>
        </main>
      </BetaAppShell>
    );
  }

  const reviewItems = items.filter(
    (item) =>
      item.validationStatus !== "valid" ||
      item.suggestedCategorySlug ||
      item.duplicateAction === "skip" ||
      item.warnings.length > 0,
  );

  return (
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto w-full max-w-2xl bg-background px-5 py-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <StickyPageHeader>
          <div className="flex items-center gap-ds-2">
            <PageBack backHref="/import" backLabel="Import" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-text-primary">Migration job</h1>
              <p className="truncate text-xs capitalize text-text-secondary">
                {job.platform.replace(/_/g, " ")} · {job.status}
              </p>
            </div>
          </div>
        </StickyPageHeader>

        <div className="mt-ds-4 flex flex-col gap-ds-4">
          <Card padding="lg">
            <MigrationBulkPublishPanel job={job} onJobUpdate={setJob} />
          </Card>

          {reviewItems.length > 0 ? (
            <Card padding="lg">
              <h2 className="text-sm font-semibold text-text-primary">Review before publishing</h2>
              <p className="mt-ds-1 text-xs text-text-secondary">
                Fix categories, duplicates, and validation issues. Valid items continue publishing.
              </p>
              <ul className="mt-ds-4 flex flex-col gap-ds-3">
                {reviewItems.slice(0, 50).map((item) => (
                  <li key={item.id} className="rounded-ds-md border border-border p-ds-3">
                    <div className="flex items-start justify-between gap-ds-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-secondary">
                          £{item.price.toFixed(2)} · {item.validationStatus} · {item.publishStatus}
                        </p>
                        {item.validationErrors.map((issue) => (
                          <p key={`${issue.field}-${issue.message}`} className="mt-ds-1 text-xs text-warning">
                            {issue.field}: {issue.message}
                          </p>
                        ))}
                      </div>
                      <label className="flex shrink-0 items-center gap-ds-1 text-xs">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => void updateItem(item.id, { selected: e.target.checked })}
                        />
                        Publish
                      </label>
                    </div>

                    {item.suggestedCategorySlug || item.validationErrors.some((e) => e.field === "category") ? (
                      <div className="mt-ds-2 flex flex-wrap items-center gap-ds-2">
                        <span className="text-xs text-text-secondary">Category:</span>
                        <select
                          className="rounded-ds-md border border-border px-ds-2 py-1 text-xs"
                          defaultValue={item.suggestedCategorySlug ?? ""}
                          onChange={(e) =>
                            void updateItem(item.id, { categorySlug: e.target.value })
                          }
                        >
                          <option value="" disabled>
                            Select category
                          </option>
                          {CATEGORY_SUGGESTIONS.map((slug) => (
                            <option key={slug} value={slug}>
                              {slug}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    {item.duplicateAction && item.existingProductId ? (
                      <div className="mt-ds-2 flex flex-wrap gap-ds-1">
                        {(["skip", "replace", "update", "create_new"] as DuplicateAction[]).map((action) => (
                          <Button
                            key={action}
                            size="sm"
                            variant={item.duplicateAction === action ? "primary" : "outline"}
                            onClick={() => void updateItem(item.id, { duplicateAction: action })}
                          >
                            {action.replace("_", " ")}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </main>
    </BetaAppShell>
  );
}
