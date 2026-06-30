"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { PremiumAssetInventory, PremiumAssetRecord } from "@/lib/super-admin/premium-design/inventory";

type PremiumAssetManagerPanelProps = {
  initialInventory: PremiumAssetInventory;
};

type Tab = "all" | "category" | "hero" | "empty-state";

export function PremiumAssetManagerPanel({ initialInventory }: PremiumAssetManagerPanelProps) {
  const [inventory, setInventory] = useState(initialInventory);
  const [tab, setTab] = useState<Tab>("all");
  const [message, setMessage] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = inventory.assets.filter((asset) => tab === "all" || asset.category === tab);

  const runAction = useCallback((action: "validate" | "rebuild" | "import") => {
    startTransition(async () => {
      setMessage(null);
      setOutput(null);
      try {
        const response = await fetch("/api/super-admin/premium-design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          message: string;
          output?: string;
          inventory?: PremiumAssetInventory;
        };
        if (data.inventory) setInventory(data.inventory);
        setMessage(data.message);
        setOutput(data.output ?? null);
      } catch {
        setMessage("Premium design action failed.");
      }
    });
  }, []);

  return (
    <div className="space-y-ds-6">
      <div className="grid gap-ds-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Category Icons", value: inventory.totals.categories },
          { label: "Hero Campaigns", value: inventory.totals.heroes },
          { label: "Empty States", value: inventory.totals.emptyStates },
          { label: "Published", value: inventory.totals.published },
        ].map((card) => (
          <div key={card.label} className="rx-surface-card rounded-ds-xl p-ds-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{card.label}</p>
            <p className="mt-ds-2 text-3xl font-bold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-ds-2">
        {(
          [
            ["all", "All Assets"],
            ["category", "Categories"],
            ["hero", "Hero"],
            ["empty-state", "Empty States"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-ds-full px-ds-4 py-ds-2 text-sm font-medium",
              tab === id ? "bg-primary text-primary-foreground" : "bg-surface-muted text-text-secondary",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-ds-3">
        <Button disabled={isPending} onClick={() => runAction("validate")}>
          Run Validation
        </Button>
        <Button variant="secondary" disabled={isPending} onClick={() => runAction("import")}>
          Import Sources
        </Button>
        <Button variant="secondary" disabled={isPending} onClick={() => runAction("rebuild")}>
          Rebuild Assets
        </Button>
      </div>

      {message ? (
        <p className="rounded-ds-lg bg-surface-muted px-ds-4 py-ds-3 text-sm text-text-primary">{message}</p>
      ) : null}

      <div className="rx-surface-card overflow-hidden rounded-ds-xl">
        <div className="border-b border-border px-ds-5 py-ds-4">
          <h2 className="text-sm font-semibold text-text-primary">Premium Asset Inventory</h2>
          <p className="mt-ds-1 text-xs text-text-muted">
            Design system {inventory.designSystemVersion} · scanned {new Date(inventory.scannedAt).toLocaleString()}
          </p>
        </div>
        <ul className="max-h-[520px] divide-y divide-border overflow-y-auto">
          {filtered.map((asset) => (
            <AssetRow key={`${asset.category}-${asset.id}`} asset={asset} />
          ))}
        </ul>
      </div>

      {output ? (
        <pre className="overflow-x-auto rounded-ds-xl bg-surface-muted p-ds-4 text-xs text-text-secondary">{output}</pre>
      ) : null}
    </div>
  );
}

function AssetRow({ asset }: { asset: PremiumAssetRecord }) {
  const preview =
    asset.category === "category"
      ? `/categories/${asset.id}.png`
      : asset.category === "hero"
        ? `/hero/${asset.id}.webp`
        : `/assets/empty-states/${asset.id}.webp`;

  return (
    <li className="flex items-center gap-ds-4 px-ds-5 py-ds-3">
      <img src={preview} alt="" width={48} height={48} className="h-12 w-12 rounded-ds-md object-contain bg-white" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium capitalize text-text-primary">{asset.label}</p>
        <p className="truncate text-xs text-text-muted">{asset.sourcePath}</p>
      </div>
      <span
        className={cn(
          "rounded-ds-full px-ds-2 py-0.5 text-[11px] font-semibold uppercase",
          asset.published ? "bg-emerald-500/15 text-emerald-700" : "bg-destructive/15 text-destructive",
        )}
      >
        {asset.published ? "Published" : "Missing"}
      </span>
    </li>
  );
}
