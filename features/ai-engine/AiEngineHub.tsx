"use client";

import Link from "next/link";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { useState } from "react";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { cn } from "@/lib/cn";
import type {
  AiEngineAnalytics,
  AiEngineContext,
  AiEngineDocument,
  AiEngineModule,
} from "@/lib/ai-engine/types";

type AiEngineHubProps = {
  config: AiEngineDocument;
  context: AiEngineContext;
  modules: AiEngineModule[];
  analytics: AiEngineAnalytics;
};

type HubTab = "dashboard" | "marketplace" | "providers" | "permissions" | "modules";

export function AiEngineHub({ config, context, modules, analytics }: AiEngineHubProps) {
  const [tab, setTab] = useState<HubTab>("dashboard");
  const { dashboard } = context;

  return (
    <BetaAppShell bottomNavTab="account">
      <BetaPageHeader title="AI" backHref="/account" />

      <HubPageMain className="aie-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-5 ">
        <header className="aie-hub__intro">
          <p className="aie-hub__eyebrow">AI Engine</p>
          <p className="text-sm text-text-secondary">
            {config.marketplaceVersion} · {config.primaryCountry} · Role: {context.role}
          </p>
          <p className="text-sm text-text-muted">
            AI score {dashboard.aiScore}% · Status: {dashboard.aiHealth}
          </p>
        </header>

        <section className={cn("aie-status-banner", !dashboard.globalEnabled && "aie-status-banner--disabled")}>
          <p className="font-semibold">
            AI {dashboard.globalEnabled ? "enabled" : "disabled"} — marketplace fully operational either way
          </p>
          <Link href="/assistant" className="aie-link mt-ds-2 inline-block">
            Open Marketplace Assistant →
          </Link>
        </section>

        <div className="aie-hub__tabs">
          {(
            [
              { id: "dashboard", label: "Dashboard" },
              { id: "marketplace", label: "Marketplace AI" },
              { id: "providers", label: "Providers" },
              { id: "permissions", label: "Permissions" },
              { id: "modules", label: "Modules" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("aie-hub__tab", tab === item.id && "aie-hub__tab--active")}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "marketplace" ? (
          <>
            <section className="aie-panel">
              <h2 className="aie-panel__title">Marketplace AI</h2>
              <div className="aie-chip-row">
                {Object.entries(config.marketplaceAi).map(([key, enabled]) => (
                  <span key={key} className={cn("aie-chip", enabled && dashboard.globalEnabled && "aie-chip--active")}>{key}</span>
                ))}
              </div>
            </section>
            <section className="aie-panel">
              <h2 className="aie-panel__title">Image & Language AI</h2>
              <div className="aie-chip-row">
                {Object.entries(config.imageAi).slice(0, 5).map(([key, enabled]) => (
                  <span key={key} className={cn("aie-chip", enabled && dashboard.globalEnabled && "aie-chip--active")}>{key}</span>
                ))}
              </div>
            </section>
          </>
        ) : tab === "providers" ? (
          <section className="aie-panel">
            <h2 className="aie-panel__title">AI Providers</h2>
            <p className="text-sm text-text-secondary mb-ds-3">
              Local: {dashboard.localModelStatus} · Cloud: {dashboard.cloudStatus}
            </p>
            <div className="aie-list">
              {config.providers.map((provider) => (
                <div key={provider.id} className="aie-list__row">
                  <div>
                    <p className="font-semibold">{provider.label}</p>
                    <p className="text-sm text-text-secondary">{provider.execution}</p>
                  </div>
                  <span className={cn("aie-chip", provider.enabled && "aie-chip--active")}>
                    {provider.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : tab === "permissions" ? (
          <section className="aie-panel">
            <h2 className="aie-panel__title">AI Permissions</h2>
            <div className="aie-chip-row">
              {config.permissions.filter((p) => p.enabled).map((role) => (
                <span key={role.id} className={cn("aie-chip", context.role === role.id && "aie-chip--active")}>
                  {role.label}
                </span>
              ))}
            </div>
            <Link href="/security" className="aie-link mt-ds-3 inline-block">
              Security Center →
            </Link>
          </section>
        ) : tab === "modules" ? (
          <section className="aie-panel">
            <h2 className="aie-panel__title">AI Modules</h2>
            <div className="aie-module-grid">
              {modules.map((module) => (
                <Link key={module.id} href={module.href} className="aie-module-card">
                  <ModuleIcon href={module.href} id={module.id} />
                  <div>
                    <p className="font-semibold">{module.label}</p>
                    <p className="text-xs text-text-secondary">{module.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="aie-panel">
              <div className="aie-analytics-grid">
                <MetricCard label="AI score" value={`${dashboard.aiScore}%`} />
                <MetricCard label="Global AI" value={dashboard.globalEnabled ? "ON" : "OFF"} />
                <MetricCard label="Modules" value={dashboard.enabledModules} />
                <MetricCard label="Providers" value={dashboard.enabledProviders} />
                <MetricCard label="Requests (24h)" value={dashboard.requests24h} />
                <MetricCard label="Errors (24h)" value={dashboard.errors24h} />
                <MetricCard label="Avg latency" value={`${dashboard.averageLatencyMs}ms`} />
                <MetricCard label="Token est." value={analytics.tokenEstimate24h} />
              </div>
            </section>
            <section className="aie-panel">
              <h2 className="aie-panel__title">Execution Policy</h2>
              <div className="aie-chip-row">
                <span className={cn("aie-chip", config.executionPolicy.priorityLocal && "aie-chip--active")}>Local first</span>
                <span className={cn("aie-chip", config.executionPolicy.priorityEdge && "aie-chip--active")}>Edge</span>
                <span className={cn("aie-chip", config.executionPolicy.cloudWhenRequired && "aie-chip--active")}>Cloud when required</span>
                <span className={cn("aie-chip", config.executionPolicy.autoFallback && "aie-chip--active")}>Auto fallback</span>
              </div>
            </section>
            <section className="aie-panel">
              <h2 className="aie-panel__title">Automation</h2>
              <div className="aie-chip-row">
                {Object.entries(config.automation).map(([key, enabled]) => (
                  <span key={key} className={cn("aie-chip", enabled && "aie-chip--active")}>{key}</span>
                ))}
              </div>
            </section>
          </>
        )}
      </HubPageMain>
    </BetaAppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="aie-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="aie-metric-card__value">{value}</p>
    </div>
  );
}
