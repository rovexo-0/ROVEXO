"use client";

import { Button } from "@/components/ui/Button";
import type { DuplicateAction, MigrationQueueItem } from "@/lib/seller/migration/types";

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

type MigrationItemReviewPanelProps = {
  jobId: string;
  items: MigrationQueueItem[];
  onItemsChange: (items: MigrationQueueItem[]) => void;
  limit?: number;
};

export function MigrationItemReviewPanel({
  jobId,
  items,
  onItemsChange,
  limit = 50,
}: MigrationItemReviewPanelProps) {
  const reviewItems = items.filter(
    (item) =>
      item.validationStatus !== "valid" ||
      item.suggestedCategorySlug ||
      item.duplicateAction === "skip" ||
      item.warnings.length > 0,
  );

  if (reviewItems.length === 0) return null;

  const updateItem = async (
    itemId: string,
    patch: { categorySlug?: string; duplicateAction?: DuplicateAction; selected?: boolean },
  ) => {
    const response = await fetch(`/api/seller/migration/${jobId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) return;

    onItemsChange(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...(patch.categorySlug !== undefined
                ? { suggestedCategorySlug: patch.categorySlug }
                : {}),
              ...(patch.duplicateAction !== undefined ? { duplicateAction: patch.duplicateAction } : {}),
              ...(patch.selected !== undefined ? { selected: patch.selected } : {}),
            }
          : item,
      ),
    );
  };

  return (
    <section className="byi-connect-card" aria-labelledby="byi-item-review-title">
      <h3 id="byi-item-review-title" className="text-sm font-semibold text-text-primary">
        Review duplicates &amp; validation
      </h3>
      <p className="mt-ds-1 text-xs text-text-secondary">
        Resolve categories, duplicates, and validation inline before publishing.
      </p>
      <ul className="mt-ds-4 flex flex-col gap-ds-3">
        {reviewItems.slice(0, limit).map((item) => (
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
                  onChange={(e) => void updateItem(item.id, { categorySlug: e.target.value })}
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
    </section>
  );
}
