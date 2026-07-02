"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/wallet/utils";
import { PROTECTION_ENGINE_FILTERS } from "@/lib/protection-engine/registry";
import type {
  ProtectionEngineAnalytics,
  ProtectionEngineContext,
  ProtectionEngineDocument,
  ProtectionEngineFilterId,
  ProtectionEngineModule,
  ProtectionEngineCaseSummary,
} from "@/lib/protection-engine/types";

type ProtectionEngineHubProps = {
  config: ProtectionEngineDocument;
  context: ProtectionEngineContext;
  modules: ProtectionEngineModule[];
  summaries: ProtectionEngineCaseSummary[];
  analytics: ProtectionEngineAnalytics;
};

export function ProtectionEngineHub({
  config,
  context,
  modules,
  summaries,
  analytics,
}: ProtectionEngineHubProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProtectionEngineFilterId | "all">("all");
  const [tab, setTab] = useState<"overview" | "cases" | "analytics">("overview");

  const filteredSummaries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summaries.filter((item) => {
      const matchesQuery =
        !q ||
        item.reason.toLowerCase().includes(q) ||
        item.caseType.toLowerCase().includes(q) ||
        item.orderId.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (filter === "all") return true;
      return item.filterTags.includes(filter);
    });
  }, [summaries, query, filter]);

  return (
    <BetaAppShell bottomNavTab="account">
      <BetaPageHeader title="Buyer Protection" backHref="/account" />

      <main className="bp-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <header className="bp-hub__intro">
          <p className="bp-hub__eyebrow">Buyer Protection Engine</p>
          <p className="text-sm text-text-secondary">
            {config.marketplaceVersion} · {config.primaryCountry} · {config.currency}
          </p>
          <p className="text-sm text-text-muted">
            {context.protectionPhase.replace(/-/g, " ")} · Fee {(context.protectionRate * 100).toFixed(0)}% ·{" "}
            {formatCurrency(context.minProtectionFee)}–{formatCurrency(context.maxProtectionFee)}
          </p>
        </header>

        <section className="bp-protection-banner">
          <p className="font-semibold">Funds remain protected until delivery is confirmed or a dispute is resolved.</p>
          <Link href="/resolution" className="bp-link mt-ds-2 inline-block">
            Open Resolution Centre →
          </Link>
        </section>

        <div className="bp-hub__tabs">
          <button type="button" className={cn("bp-hub__tab", tab === "overview" && "bp-hub__tab--active")} onClick={() => setTab("overview")}>
            Overview
          </button>
          <button type="button" className={cn("bp-hub__tab", tab === "cases" && "bp-hub__tab--active")} onClick={() => setTab("cases")}>
            Cases
          </button>
          <button type="button" className={cn("bp-hub__tab", tab === "analytics" && "bp-hub__tab--active")} onClick={() => setTab("analytics")}>
            Analytics
          </button>
        </div>

        {tab === "analytics" ? (
          <section className="bp-panel">
            <div className="bp-analytics-grid">
              <MetricCard label="Open cases" value={analytics.openCases} />
              <MetricCard label="Closed cases" value={analytics.closedCases} />
              <MetricCard label="Refund value" value={formatCurrency(analytics.refundValue)} />
              <MetricCard label="Partial refunds" value={analytics.partialRefunds} />
              <MetricCard label="Avg resolution" value={`${analytics.averageResolutionDays}d`} />
              <MetricCard label="Dispute rate" value={`${(analytics.disputeRate * 100).toFixed(1)}%`} />
              <MetricCard label="Buyer satisfaction" value={`${(analytics.buyerSatisfaction * 100).toFixed(0)}%`} />
              <MetricCard label="Protection cost" value={formatCurrency(analytics.protectionCost)} />
            </div>
          </section>
        ) : tab === "cases" ? (
          <>
            <input
              className="bp-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search case reason, type, order…"
            />
            <div className="bp-chip-row">
              <button type="button" className={cn("bp-chip", filter === "all" && "bp-chip--active")} onClick={() => setFilter("all")}>
                All
              </button>
              {PROTECTION_ENGINE_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn("bp-chip", filter === item.id && "bp-chip--active")}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <CaseList cases={filteredSummaries} />
          </>
        ) : (
          <>
            <section className="bp-panel">
              <h2 className="bp-panel__title">Protection Flow</h2>
              <p className="text-sm text-text-secondary">
                Purchase → Payment → Protection → Shipping → Delivery → Review → Resolution → Wallet Release
              </p>
              <div className="bp-stats-grid mt-ds-4">
                <StatChip label="Buyer cases" value={context.buyerCaseCount} />
                <StatChip label="Seller cases" value={context.sellerCaseCount} />
                <StatChip label="Open cases" value={context.openCaseCount} />
              </div>
            </section>
            <CaseList cases={context.recentCases} title="Recent cases" />
          </>
        )}

        <section className="bp-panel">
          <h2 className="bp-panel__title">Integrations</h2>
          <div className="bp-module-grid">
            {modules.slice(3).map((module) => (
              <Link key={module.id} href={module.href} className="bp-module-card">
                <span>{module.icon}</span>
                <span className="font-semibold">{module.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </BetaAppShell>
  );
}

function CaseList({ cases, title = "Cases" }: { cases: ProtectionEngineCaseSummary[]; title?: string }) {
  return (
    <section className="bp-panel">
      <h2 className="bp-panel__title">{title}</h2>
      <div className="bp-list">
        {cases.length === 0 ? <p className="text-sm text-text-muted">No protection cases yet.</p> : null}
        {cases.map((item) => (
          <Link key={item.caseId} href={`/resolution/${item.caseId}`} className="bp-list__row bp-list__row--link">
            <div>
              <p className="font-semibold">{item.reason || item.caseType}</p>
              <p className="text-sm text-text-secondary">
                {item.enterpriseStatus.replace(/-/g, " ")} · {item.role}
              </p>
            </div>
            {item.refundAmount != null ? (
              <span className="font-semibold">{formatCurrency(item.refundAmount)}</span>
            ) : (
              <span className="bp-chip">{item.outcome.replace(/_/g, " ")}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bp-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="bp-metric-card__value">{value}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="bp-stat-chip">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
