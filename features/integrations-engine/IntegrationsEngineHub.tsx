"use client";

import Link from "next/link";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { useState } from "react";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { cn } from "@/lib/cn";
import type {
  IntegrationsEngineAnalytics,
  IntegrationsEngineContext,
  IntegrationsEngineDocument,
  IntegrationsEngineModule,
} from "@/lib/integrations-engine/types";

type IntegrationsEngineHubProps = {
  config: IntegrationsEngineDocument;
  context: IntegrationsEngineContext;
  modules: IntegrationsEngineModule[];
  analytics: IntegrationsEngineAnalytics;
};

type HubTab = "dashboard" | "providers" | "webhooks" | "communications" | "modules";

export function IntegrationsEngineHub({ config, context, modules, analytics }: IntegrationsEngineHubProps) {
  const [tab, setTab] = useState<HubTab>("dashboard");
  const { dashboard } = context;

  return (
    <BetaAppShell bottomNavTab="account">
      <BetaPageHeader title="Integrations" backHref="/account" />

      <HubPageMain className="integ-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-5 ">
        <header className="integ-hub__intro">
          <p className="integ-hub__eyebrow">Integrations Engine</p>
          <p className="text-sm text-text-secondary">
            {config.marketplaceVersion} · {config.primaryCountry} · Role: {context.role}
          </p>
          <p className="text-sm text-text-muted">
            Integration score {dashboard.integrationScore}% · Health: {dashboard.integrationHealth}
          </p>
        </header>

        <section className="integ-live-banner">
          <p className="font-semibold">
            {dashboard.configuredProviders} providers configured · {dashboard.successRate}% success rate
          </p>
          <Link href="/super-admin/monitoring" className="integ-link mt-ds-2 inline-block">
            Health monitor →
          </Link>
        </section>

        <div className="integ-hub__tabs">
          {(
            [
              { id: "dashboard", label: "Dashboard" },
              { id: "providers", label: "Providers" },
              { id: "webhooks", label: "Webhooks" },
              { id: "communications", label: "Communications" },
              { id: "modules", label: "Modules" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("integ-hub__tab", tab === item.id && "integ-hub__tab--active")}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "providers" ? (
          <section className="integ-panel">
            <h2 className="integ-panel__title">Live Provider Status</h2>
            <div className="integ-list">
              {context.providers.map((provider) => (
                <div key={provider.id} className="integ-list__row">
                  <div>
                    <p className="font-semibold">{provider.label}</p>
                    <p className="text-sm text-text-secondary">{provider.category}</p>
                  </div>
                  <span className={cn("integ-chip", provider.status === "healthy" && "integ-chip--active")}>
                    {provider.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : tab === "webhooks" ? (
          <section className="integ-panel">
            <h2 className="integ-panel__title">Webhook Management</h2>
            <div className="integ-chip-row">
              {Object.entries(config.webhooks).map(([key, enabled]) => (
                <span key={key} className={cn("integ-chip", enabled && "integ-chip--active")}>{key}</span>
              ))}
            </div>
          </section>
        ) : tab === "communications" ? (
          <>
            <section className="integ-panel">
              <h2 className="integ-panel__title">Email Services</h2>
              <div className="integ-chip-row">
                {Object.entries(config.emailServices).map(([key, enabled]) => (
                  <span key={key} className={cn("integ-chip", enabled && "integ-chip--active")}>{key}</span>
                ))}
              </div>
            </section>
            <section className="integ-panel">
              <h2 className="integ-panel__title">Push Notifications</h2>
              <div className="integ-chip-row">
                {Object.entries(config.pushNotifications).map(([key, enabled]) => (
                  <span key={key} className={cn("integ-chip", enabled && "integ-chip--active")}>{key}</span>
                ))}
              </div>
            </section>
          </>
        ) : tab === "modules" ? (
          <section className="integ-panel">
            <h2 className="integ-panel__title">Integration Modules</h2>
            <div className="integ-module-grid">
              {modules.map((module) => (
                <Link key={module.id} href={module.href} className="integ-module-card">
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
            <section className="integ-panel">
              <div className="integ-analytics-grid">
                <MetricCard label="Integration score" value={`${dashboard.integrationScore}%`} />
                <MetricCard label="Configured" value={dashboard.configuredProviders} />
                <MetricCard label="Healthy" value={dashboard.healthyProviders} />
                <MetricCard label="API health" value={`${dashboard.apiHealth}%`} />
                <MetricCard label="Avg latency" value={`${dashboard.averageLatencyMs}ms`} />
                <MetricCard label="Errors (24h)" value={dashboard.errors24h} />
                <MetricCard label="Payment providers" value={analytics.paymentProviders} />
                <MetricCard label="Shipping providers" value={analytics.shippingProviders} />
              </div>
            </section>
            <section className="integ-panel">
              <h2 className="integ-panel__title">Payment & Shipping</h2>
              <div className="integ-chip-row">
                {Object.entries(config.paymentProviders).slice(0, 4).map(([key, enabled]) => (
                  <span key={key} className={cn("integ-chip", enabled && "integ-chip--active")}>{key}</span>
                ))}
                {Object.entries(config.shippingProviders).slice(0, 4).map(([key, enabled]) => (
                  <span key={key} className={cn("integ-chip", enabled && "integ-chip--active")}>{key}</span>
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
    <div className="integ-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="integ-metric-card__value">{value}</p>
    </div>
  );
}
