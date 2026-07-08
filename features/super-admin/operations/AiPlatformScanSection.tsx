"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AiOperationsSnapshot } from "@/lib/super-admin/operations/types";
import { SEVERITY_BADGE, SEVERITY_DOT, SEVERITY_LABEL } from "@/features/super-admin/operations/utils";

type AiPlatformScanSectionProps = {
  snapshot: AiOperationsSnapshot;
  onScanned: (snapshot: AiOperationsSnapshot) => void;
};

export function AiPlatformScanSection({ snapshot, onScanned }: AiPlatformScanSectionProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setScanning(true);
    try {
      const response = await fetch("/api/super-admin/operations/scan", { method: "POST" });
      const text = await response.text();
      let payload: { success?: boolean; data?: { snapshot?: AiOperationsSnapshot }; snapshot?: AiOperationsSnapshot; error?: string } = {};
      try {
        payload = text ? (JSON.parse(text) as typeof payload) : {};
      } catch {
        throw new Error("Invalid JSON response from operations scan.");
      }

      const snapshot = payload.data?.snapshot ?? payload.snapshot;
      if (!response.ok || !snapshot) {
        throw new Error(payload.error ?? "Scan failed.");
      }
      onScanned(snapshot);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <section className="ai-ops-section">
      <div className="flex flex-wrap items-end justify-between gap-ds-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">AI Platform Scan</h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Deep scan across stack, integrations, SEO, security, and performance surfaces.
          </p>
        </div>
        <Button
          size="lg"
          className="min-h-12 min-w-[180px] rounded-ds-xl bg-gradient-to-r from-primary to-purple-700 shadow-[0_12px_32px_rgba(147,51,234,0.35)]"
          onClick={() => void runScan()}
          disabled={scanning}
        >
          {scanning ? "Scanning…" : "Run AI Scan"}
        </Button>
      </div>

      {error ? <p className="mt-ds-3 text-sm text-danger">{error}</p> : null}

      <div className="mt-ds-5 grid gap-ds-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {snapshot.scanResults.map((item) => (
          <Card
            key={item.id}
            padding="sm"
            className="rx-glass border border-border/70 bg-white/80 dark:bg-slate-900/70"
          >
            <div className="flex items-center justify-between gap-ds-2">
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
              <span className={`h-2.5 w-2.5 rounded-full ${SEVERITY_DOT[item.status]}`} aria-hidden />
            </div>
            <div className="mt-ds-2 flex items-center gap-ds-2">
              <Badge variant={SEVERITY_BADGE[item.status]}>{SEVERITY_LABEL[item.status]}</Badge>
              <span className="text-[11px] text-text-muted">{item.durationMs}ms</span>
            </div>
            <p className="mt-ds-2 line-clamp-2 text-xs text-text-secondary">{item.message}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
