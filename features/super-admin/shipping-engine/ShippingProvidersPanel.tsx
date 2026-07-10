"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { ShippingProvidersSnapshot } from "@/lib/shipping/providers/types";

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "healthy"
      ? "bg-success/15 text-success"
      : status === "degraded"
        ? "bg-warning/15 text-warning"
        : "bg-danger/15 text-danger";

  return (
    <span className={cn("rounded-ds-full px-ds-2 py-0.5 text-xs font-semibold capitalize", tone)}>
      {status}
    </span>
  );
}

function ProviderCard({
  provider,
}: {
  provider: ShippingProvidersSnapshot["provider"];
}) {
  return (
    <Card padding="lg" className="flex flex-col gap-ds-3">
      <div className="flex items-center justify-between gap-ds-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Shipping Provider</p>
          <h3 className="text-base font-semibold text-text-primary">{provider.name}</h3>
        </div>
        <StatusPill status={provider.status} />
      </div>

      <dl className="grid grid-cols-2 gap-ds-2 text-sm">
        <div>
          <dt className="text-text-muted">API</dt>
          <dd className="font-medium capitalize">{provider.status}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Quotes</dt>
          <dd className="font-medium capitalize">{provider.quoteStatus}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Labels</dt>
          <dd className="font-medium capitalize">{provider.labelStatus}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Tracking</dt>
          <dd className="font-medium capitalize">{provider.trackingStatus}</dd>
        </div>
        {provider.latencyMs != null ? (
          <div className="col-span-2">
            <dt className="text-text-muted">Latency</dt>
            <dd className="font-medium">{provider.latencyMs}ms</dd>
          </div>
        ) : null}
        {provider.message ? (
          <div className="col-span-2">
            <dt className="text-text-muted">Base URL</dt>
            <dd className="font-medium break-all">{provider.message}</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}

/**
 * Super Admin — Sendcloud shipping provider monitor.
 */
export function ShippingProvidersPanel() {
  const [snapshot, setSnapshot] = useState<ShippingProvidersSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/super-admin/shipping-providers");
      const payload = (await response.json()) as ShippingProvidersSnapshot & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to load shipping providers.");
        return;
      }
      setSnapshot(payload);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!snapshot && !error) {
    return <p className="text-sm text-text-secondary">Loading shipping providers…</p>;
  }

  return (
    <div className="flex flex-col gap-ds-5">
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {snapshot ? (
        <div className="flex flex-col gap-ds-4">
          <div className="flex items-center justify-between gap-ds-3">
            <p className="text-sm text-text-secondary">
              All shipping operations route exclusively through Sendcloud.
            </p>
            <Button variant="outline" size="sm" disabled={isPending} onClick={load}>
              Refresh
            </Button>
          </div>
          <ProviderCard provider={snapshot.provider} />
        </div>
      ) : null}
    </div>
  );
}
