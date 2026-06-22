"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AdminCategory } from "@/lib/categories/admin";

type CategoriesAdminProps = {
  initialCategories: AdminCategory[];
};

export function CategoriesAdmin({ initialCategories }: CategoriesAdminProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [selectedId, setSelectedId] = useState<string | null>(initialCategories[0]?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => categories.find((category) => category.id === selectedId) ?? null,
    [categories, selectedId],
  );

  const topLevel = useMemo(() => categories.filter((category) => !category.parentId), [categories]);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/categories");
    if (!response.ok) return;
    const payload = (await response.json()) as { categories: AdminCategory[] };
    setCategories(payload.categories);
  }, []);

  const seedFilters = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_filters" }),
      });
      const payload = (await response.json()) as { seeded?: number; error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "Failed to seed filters.");
        return;
      }
      setMessage(`Seeded ${payload.seeded ?? 0} filter definitions.`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const saveCategory = useCallback(async () => {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/categories/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seoTitle: selected.seoTitle,
          seoDescription: selected.seoDescription,
          icon: selected.icon,
          isActive: selected.isActive,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "Failed to save category.");
        return;
      }
      setMessage("Category saved.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh, selected]);

  return (
    <div className="space-y-ds-4">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div>
          <h2 className="text-xl font-semibold">Category Taxonomy</h2>
          <p className="text-sm text-text-secondary">
            {topLevel.length} top-level categories · {categories.length} total
          </p>
        </div>
        <div className="flex gap-ds-2">
          <Button variant="secondary" onClick={seedFilters} disabled={busy}>
            Seed Filters
          </Button>
          <Button variant="secondary" onClick={refresh} disabled={busy}>
            Refresh
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-text-secondary">{message}</p>}

      <div className="grid gap-ds-4 lg:grid-cols-[280px_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto p-ds-3">
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(category.id)}
                  className={`flex w-full items-center gap-ds-2 rounded-lg px-ds-2 py-ds-2 text-left text-sm ${
                    selectedId === category.id ? "bg-primary/10 text-primary" : "hover:bg-surface-elevated"
                  }`}
                >
                  <span>{category.icon}</span>
                  <span className="truncate">{category.name}</span>
                  {!category.isActive && <Badge variant="warning">Inactive</Badge>}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {selected && (
          <Card className="space-y-ds-4 p-ds-4">
            <div>
              <h3 className="text-lg font-semibold">
                {selected.icon} {selected.name}
              </h3>
              <p className="text-sm text-text-muted">{selected.pathLabel}</p>
              <p className="text-xs text-text-muted">Slug: {selected.slug}</p>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Icon</span>
              <input
                className="w-full rounded-lg border border-border bg-surface px-ds-3 py-ds-2"
                value={selected.icon}
                onChange={(event) =>
                  setCategories((prev) =>
                    prev.map((category) =>
                      category.id === selected.id ? { ...category, icon: event.target.value } : category,
                    ),
                  )
                }
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">SEO Title</span>
              <input
                className="w-full rounded-lg border border-border bg-surface px-ds-3 py-ds-2"
                value={selected.seoTitle ?? ""}
                onChange={(event) =>
                  setCategories((prev) =>
                    prev.map((category) =>
                      category.id === selected.id ? { ...category, seoTitle: event.target.value } : category,
                    ),
                  )
                }
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">SEO Description</span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-border bg-surface px-ds-3 py-ds-2"
                value={selected.seoDescription ?? ""}
                onChange={(event) =>
                  setCategories((prev) =>
                    prev.map((category) =>
                      category.id === selected.id
                        ? { ...category, seoDescription: event.target.value }
                        : category,
                    ),
                  )
                }
              />
            </label>

            <label className="flex items-center gap-ds-2 text-sm">
              <input
                type="checkbox"
                checked={selected.isActive}
                onChange={(event) =>
                  setCategories((prev) =>
                    prev.map((category) =>
                      category.id === selected.id ? { ...category, isActive: event.target.checked } : category,
                    ),
                  )
                }
              />
              Active
            </label>

            <Button onClick={saveCategory} disabled={busy}>
              Save Category
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
