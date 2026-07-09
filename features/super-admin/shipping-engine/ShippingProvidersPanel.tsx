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
  title,
  priority,
  provider,
  fallbackNote,
}: {
  title: string;
  priority: number;
  provider: ShippingProvidersSnapshot["primary"];
  fallbackNote?: string;
}) {
  return (
    <Card padding="lg" className="flex flex-col gap-ds-3">
      <div className="flex items-center justify-between gap-ds-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</p>
          <h3 className="text-base font-semibold text-text-primary">
            {provider.name} <span className="text-text-muted">(Priority {priority})</span>
          </h3>
        </div>
        <StatusPill status={provider.status} />
      </div>

      {fallbackNote ? <p className="text-xs text-text-secondary">{fallbackNote}</p> : null}

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
      </dl>
    </Card>
  );
}

/**
 * Super Admin — Shipping Providers monitor.
 * Parcel2Go (primary) + Shippo (fallback-only) with fallback event log.
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

  function toggleFallback() {
    if (!snapshot) return;
    startTransition(async () => {
      const response = await fetch("/api/super-admin/shipping-providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippoFallbackForced: !snapshot.shippoFallbackForced }),
      });
      const payload = (await response.json()) as ShippingProvidersSnapshot & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to update fallback setting.");
        return;
      }
      setSnapshot(payload);
    });
  }

  if (!snapshot && !error) {
    return <p className="text-sm text-text-secondary">Loading shipping providers…</p>;
  }

  return (
    <div className="flex flex-col gap-ds-5">
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {snapshot ? (
        <>
          <div className="grid gap-ds-4 lg:grid-cols-2">
            <ProviderCard title="Primary Provider" priority={1} provider={snapshot.primary} />
            <ProviderCard
              title="Fallback Provider"
              priority={2}
              provider={snapshot.fallback}
              fallbackNote="Used only when Parcel2Go is unavailable, times out, or carrier/service is unavailable — or when manually forced below."
            />
          </div>

          <Card padding="lg" className="flex flex-col gap-ds-3">
            <div className="flex flex-wrap items-center justify-between gap-ds-3">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Manual Shippo Fallback</h3>
                <p className="mt-ds-1 text-sm text-text-secondary">
                  Force all quote and label requests through Shippo immediately.
                </p>
              </div>
              <Button
                variant={snapshot.shippoFallbackForced ? "danger" : "outline"}
                disabled={isPending}
                onClick={toggleFallback}
              >
                {snapshot.shippoFallbackForced ? "Disable Forced Fallback" : "Enable Forced Fallback"}
              </Button>
            </div>
          </Card>

          <Card padding="lg" className="flex flex-col gap-ds-3">
            <div className="flex items-center justify-between gap-ds-3">
              <h3 className="text-base font-semibold text-text-primary">Fallback Events</h3>
              <Button variant="outline" size="sm" disabled={isPending} onClick={load}>
                Refresh
              </Button>
            </div>

            {snapshot.recentFallbackEvents.length === 0 ? (
              <p className="text-sm text-text-secondary">No fallback events recorded.</p>
            ) : (
              <ul className="divide-y divide-border">
                {snapshot.recentFallbackEvents.map((event) => (
                  <li key={event.id} className="flex flex-col gap-ds-1 py-ds-3 text-sm">
                    <div className="flex flex-wrap items-center gap-ds-2">
                      <span className="font-semibold capitalize">{event.operation}</span>
                      <span className="text-text-muted">·</span>
                      <span className="text-text-secondary">
                        {event.primaryProvider} → {event.fallbackProvider}
                      </span>
                      <span className="text-text-muted">·</span>
                      <span className="capitalize text-warning">{event.reason.replace(/_/g, " ")}</span>
                    </div>
                    {event.errorMessage ? (
                      <p className="text-xs text-text-muted">{event.errorMessage}</p>
                    ) : null}
                    <p className="text-xs text-text-muted">
                      {new Date(event.createdAt).toLocaleString("en-GB")}
                      {event.orderId ? ` · Order ${event.orderId.slice(0, 8)}…` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
