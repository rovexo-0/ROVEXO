"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type ShipmentRow = {
  id: string;
  order_id: string;
  status: string | null;
  carrier: string | null;
  tracking_number: string | null;
  parcel2go_order_id: string | null;
  parcel2go_reference: string | null;
  service_code: string | null;
  tracking_url: string | null;
  shipping_price_pence: number | null;
  last_tracking_sync_at: string | null;
  updated_at: string | null;
};

type LabelRow = {
  id: string;
  shipping_record_id: string;
  tracking_number: string | null;
  carrier: string | null;
  label_status: string | null;
  label_url: string | null;
  label_storage_path: string | null;
  label_mime_type: string | null;
  label_size_bytes: number | null;
  parcel2go_reference: string | null;
  updated_at: string | null;
};

type WebhookRow = {
  id: string;
  event_id: string | null;
  event_type: string;
  parcel2go_order_id: string | null;
  tracking_number: string | null;
  processed: boolean;
  correlation_id: string | null;
  event_timestamp: string | null;
  created_at: string | null;
};

type HealthResult = {
  status?: string;
  environment?: string;
  oauthOk?: boolean;
  apiReachable?: boolean;
  latencyMs?: number;
} | null;

type ApiResponse = {
  configured: boolean;
  health: HealthResult;
  shipments: ShipmentRow[];
  labels: LabelRow[];
  webhookEvents: WebhookRow[];
};

type SubTab = "shipments" | "tracking" | "labels" | "webhooks";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "shipments", label: "Live Shipments" },
  { id: "tracking", label: "Tracking" },
  { id: "labels", label: "Labels" },
  { id: "webhooks", label: "Webhook Events" },
];

const STATUS_OPTIONS = [
  "",
  "preparing",
  "collected",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
  "cancelled",
  "lost",
  "failed",
];

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function Parcel2GoLivePanel() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("shipments");
  const [status, setStatus] = useState("");
  const [carrier, setCarrier] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setMessage(null);
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (carrier) params.set("carrier", carrier);
      if (query) params.set("q", query);
      const response = await fetch(`/api/super-admin/parcel2go?${params.toString()}`);
      const payload = (await response.json()) as ApiResponse & { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "Failed to load Parcel2Go data.");
        return;
      }
      setData(payload);
    });
  }, [status, carrier, query]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retryTracking = useCallback(
    (row: ShipmentRow) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/parcel2go", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "retry-tracking",
            orderId: row.order_id,
            shipmentId: row.parcel2go_order_id ?? row.order_id,
            trackingNumber: row.tracking_number,
          }),
        });
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        setMessage(
          response.ok
            ? `Tracking refreshed for order ${row.order_id.slice(0, 8)}.`
            : payload.error ?? "Tracking retry failed.",
        );
        if (response.ok) load();
      });
    },
    [load],
  );

  const openLabel = useCallback((row: LabelRow) => {
    startTransition(async () => {
      setMessage(null);
      if (row.label_storage_path) {
        const response = await fetch("/api/super-admin/parcel2go", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "label-url", storagePath: row.label_storage_path }),
        });
        const payload = (await response.json()) as { signedUrl?: string; error?: string };
        if (response.ok && payload.signedUrl) {
          window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
          return;
        }
        setMessage(payload.error ?? "Unable to open label.");
        return;
      }
      if (row.label_url) {
        window.open(row.label_url, "_blank", "noopener,noreferrer");
        return;
      }
      setMessage("No label file available.");
    });
  }, []);

  const health = data?.health;

  return (
    <section className="ea-panel">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <h2 className="ea-panel__title">Parcel2Go Live Operations</h2>
        <div className="ea-chip-row">
          <span className={cn("ea-chip", data?.configured && "ea-chip--active")}>
            {data?.configured ? "Configured" : "Not configured"}
          </span>
          {health ? (
            <>
              <span className={cn("ea-chip", health.status === "healthy" && "ea-chip--active")}>
                OAuth {health.status ?? "unknown"}
              </span>
              <span className="ea-chip">{health.environment ?? "unknown"}</span>
              {typeof health.latencyMs === "number" ? (
                <span className="ea-chip">{health.latencyMs}ms</span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-ds-4 flex flex-wrap items-end gap-ds-3">
        <label className="flex flex-col gap-ds-1 text-sm">
          <span className="text-text-secondary">Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
            placeholder="Order / tracking / P2G id"
            className="min-h-[40px] rounded-ds-md border border-border bg-surface px-ds-3 text-sm"
          />
        </label>
        <label className="flex flex-col gap-ds-1 text-sm">
          <span className="text-text-secondary">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="min-h-[40px] rounded-ds-md border border-border bg-surface px-ds-3 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s || "All statuses"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-ds-1 text-sm">
          <span className="text-text-secondary">Carrier</span>
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
            placeholder="Evri, DPD…"
            className="min-h-[40px] rounded-ds-md border border-border bg-surface px-ds-3 text-sm"
          />
        </label>
        <Button size="sm" disabled={isPending} onClick={load}>
          {isPending ? "Loading…" : "Apply filters"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => {
            setStatus("");
            setCarrier("");
            setQuery("");
          }}
        >
          Clear
        </Button>
      </div>

      {message ? <p className="mt-ds-3 text-sm text-text-secondary">{message}</p> : null}

      <div className="ea-chip-row mt-ds-4">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={cn("ea-chip", subTab === tab.id && "ea-chip--active")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ea-list mt-ds-4">
        {subTab === "shipments" || subTab === "tracking"
          ? (data?.shipments ?? []).map((row) => (
              <div key={row.id} className="se-list__row">
                <div>
                  <p className="font-semibold">
                    Order {row.order_id.slice(0, 8)} · {row.carrier ?? "—"}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {row.status ?? "—"} · tracking {row.tracking_number ?? "—"} · P2G{" "}
                    {row.parcel2go_order_id ?? "—"}
                  </p>
                  {subTab === "tracking" ? (
                    <p className="text-xs text-text-muted">
                      Last sync {formatDate(row.last_tracking_sync_at)}
                      {row.tracking_url ? (
                        <>
                          {" · "}
                          <a
                            href={row.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ea-link"
                          >
                            Carrier tracking
                          </a>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-ds-2">
                  <span className={cn("ea-chip", row.status === "delivered" && "ea-chip--active")}>
                    {row.status ?? "—"}
                  </span>
                  {row.tracking_number ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => retryTracking(row)}
                    >
                      Retry tracking
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          : null}

        {subTab === "labels"
          ? (data?.labels ?? []).map((row) => (
              <div key={row.id} className="se-list__row">
                <div>
                  <p className="font-semibold">
                    {row.carrier ?? "—"} · {row.tracking_number ?? "—"}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {row.label_status ?? "—"} · {row.label_mime_type ?? "—"} ·{" "}
                    {formatBytes(row.label_size_bytes)} · ref {row.parcel2go_reference ?? "—"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {row.label_storage_path ? "Stored in Supabase" : "External URL only"} · updated{" "}
                    {formatDate(row.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-ds-2">
                  <span className={cn("ea-chip", row.label_status === "ready" && "ea-chip--active")}>
                    {row.label_status ?? "—"}
                  </span>
                  {row.label_storage_path || row.label_url ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => openLabel(row)}
                    >
                      Open PDF
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          : null}

        {subTab === "webhooks"
          ? (data?.webhookEvents ?? []).map((row) => (
              <div key={row.id} className="se-list__row">
                <div>
                  <p className="font-semibold">{row.event_type}</p>
                  <p className="text-sm text-text-secondary">
                    P2G {row.parcel2go_order_id ?? "—"} · tracking {row.tracking_number ?? "—"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDate(row.event_timestamp ?? row.created_at)} · corr{" "}
                    {row.correlation_id?.slice(0, 8) ?? "—"}
                  </p>
                </div>
                <span className={cn("ea-chip", row.processed && "ea-chip--active")}>
                  {row.processed ? "Processed" : "Pending"}
                </span>
              </div>
            ))
          : null}

        {data &&
        ((subTab === "shipments" || subTab === "tracking") && data.shipments.length === 0
          ? true
          : subTab === "labels" && data.labels.length === 0
            ? true
            : subTab === "webhooks" && data.webhookEvents.length === 0) ? (
          <p className="text-sm text-text-secondary">No records for the current filters.</p>
        ) : null}
      </div>
    </section>
  );
}
