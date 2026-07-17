"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import type { CertificationDashboardScanResult } from "@/lib/launch-certification/dashboard-scanner";

type DashboardPayload = {
  dashboard?: CertificationDashboardScanResult;
  privateMode?: {
    active: boolean;
    publicRegistrationEnabled: boolean;
    googleIndexingEnabled: boolean;
  };
  mode?: {
    virtualPayments: boolean;
    virtualWallet?: boolean;
    sendcloudSandbox?: boolean;
  };
  fullDemo?: {
    version: string;
    accounts: Array<{ key: string; email: string; label: string; virtualFundsGbp: number }>;
    security: {
      realStripeBlocked: boolean;
      realSendcloudBlocked: boolean;
    };
  };
  error?: string;
};

function statusClass(status: string) {
  if (status === "pass") return "text-emerald-600";
  if (status === "fail") return "text-red-600";
  return "text-amber-600";
}

export function CertificationDashboard() {
  const [scan, setScan] = useState<CertificationDashboardScanResult | null>(null);
  const [privateMode, setPrivateMode] = useState<DashboardPayload["privateMode"]>();
  const [virtualPayments, setVirtualPayments] = useState(false);
  const [fullDemo, setFullDemo] = useState<DashboardPayload["fullDemo"]>();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch("/api/super-admin/launch-certification");
        const payload = (await response.json()) as DashboardPayload;
        if (!response.ok) {
          setError(payload.error ?? "Unable to load certification dashboard.");
          return;
        }
        setScan(payload.dashboard ?? null);
        setPrivateMode(payload.privateMode);
        setVirtualPayments(Boolean(payload.mode?.virtualPayments));
        setFullDemo(payload.fullDemo);
      } catch {
        setError("Unable to load certification dashboard.");
      }
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-ds-4 p-ds-4">
      <header className="flex flex-col gap-ds-2">
        <h1 className="text-2xl font-bold text-text-primary">Certification Dashboard</h1>
        <p className="text-sm text-text-secondary">
          Production simulation — validate every module before official launch.
        </p>
      </header>

      <section className="grid gap-ds-3 rounded-ds-lg border border-border bg-surface p-ds-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Mode</p>
          <p className="text-sm font-medium text-text-primary">
            {privateMode?.active ? "Certification (Private)" : "Official Launch Ready"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Virtual payments</p>
          <p className="text-sm font-medium text-text-primary">
            {virtualPayments ? "Enabled" : "Disabled"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Public registration</p>
          <p className="text-sm font-medium text-text-primary">
            {privateMode?.publicRegistrationEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Google indexing</p>
          <p className="text-sm font-medium text-text-primary">
            {privateMode?.googleIndexingEnabled ? "Enabled" : "Disabled (NOINDEX)"}
          </p>
        </div>
      </section>

      {fullDemo ? (
        <section className="grid gap-ds-3 rounded-ds-lg border border-border bg-surface p-ds-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Full Demo Accounts ({fullDemo.version})
            </p>
            <ul className="mt-ds-2 space-y-ds-1 text-sm text-text-primary">
              {fullDemo.accounts.map((account) => (
                <li key={account.key}>
                  {account.label} — {account.email} — £
                  {account.virtualFundsGbp.toLocaleString("en-GB")} virtual
                </li>
              ))}
            </ul>
          </div>
          <div className="text-sm text-text-secondary">
            Real Stripe blocked: {fullDemo.security.realStripeBlocked ? "Yes" : "No"} · Real
            Sendcloud blocked: {fullDemo.security.realSendcloudBlocked ? "Yes" : "No"}
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-between gap-ds-3">
        <p className="text-sm text-text-secondary">
          {scan
            ? `${scan.passCount}/${scan.totalCount} modules passed (${scan.passPercent}%)`
            : "Loading certification scan…"}
        </p>
        <button
          type="button"
          className="rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm font-semibold"
          disabled={isPending}
          onClick={refresh}
        >
          {isPending ? "Scanning…" : "Rescan"}
        </button>
      </div>

      {error ? (
        <p className="rounded-ds-md border border-destructive/30 bg-destructive/5 px-ds-3 py-ds-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-ds-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="px-ds-3 py-ds-2 font-semibold">Module</th>
              <th className="px-ds-3 py-ds-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {(scan?.modules ?? []).map((module) => (
              <tr key={module.id} className="border-t border-border">
                <td className="px-ds-3 py-ds-2">{module.label}</td>
                <td className={cn("px-ds-3 py-ds-2 font-bold uppercase", statusClass(module.status))}>
                  {module.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scan?.allPassed ? (
        <p className="rounded-ds-md border border-emerald-500/30 bg-emerald-500/10 px-ds-3 py-ds-2 text-sm font-semibold text-emerald-700">
          100% Certification Passed — eligible for official launch review.
        </p>
      ) : (
        <p className="rounded-ds-md border border-amber-500/30 bg-amber-500/10 px-ds-3 py-ds-2 text-sm text-amber-800">
          Official launch blocked until all modules pass.
        </p>
      )}
    </div>
  );
}
