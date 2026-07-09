"use client";

import Link from "next/link";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { useState } from "react";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { cn } from "@/lib/cn";
import type {
  SecurityEngineAnalytics,
  SecurityEngineContext,
  SecurityEngineDocument,
  SecurityEngineModule,
} from "@/lib/security-engine/types";

type SecurityEngineHubProps = {
  config: SecurityEngineDocument;
  context: SecurityEngineContext;
  modules: SecurityEngineModule[];
  analytics: SecurityEngineAnalytics;
};

type HubTab = "dashboard" | "authorization" | "devices" | "threat" | "modules";

export function SecurityEngineHub({ config, context, modules, analytics }: SecurityEngineHubProps) {
  const [tab, setTab] = useState<HubTab>("dashboard");
  const { dashboard } = context;

  return (
    <BetaAppShell bottomNavTab="account">
      <BetaPageHeader title="Security" backHref="/account" />

      <HubPageMain className="sec-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-5 ">
        <header className="sec-hub__intro">
          <p className="sec-hub__eyebrow">Security Engine</p>
          <p className="text-sm text-text-secondary">
            {config.marketplaceVersion} · {config.primaryCountry} · Role: {context.role}
          </p>
          <p className="text-sm text-text-muted">
            Security score {dashboard.securityScore}% · Threat level: {dashboard.threatLevel}
          </p>
        </header>

        <section className="sec-security-banner">
          <p className="font-semibold">Authentication status: {dashboard.authenticationStatus}</p>
          <Link href="/account/security" className="sec-link mt-ds-2 inline-block">
            Manage account security →
          </Link>
        </section>

        <div className="sec-hub__tabs">
          {(
            [
              { id: "dashboard", label: "Dashboard" },
              { id: "authorization", label: "Authorization" },
              { id: "devices", label: "Devices" },
              { id: "threat", label: "Threat" },
              { id: "modules", label: "Modules" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("sec-hub__tab", tab === item.id && "sec-hub__tab--active")}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "authorization" ? (
          <section className="sec-panel">
            <h2 className="sec-panel__title">Authorization Center</h2>
            <div className="sec-stats-grid">
              <StatChip label="Permission routes" value={analytics.permissionRoutes} />
              <StatChip label="Admin gated" value={analytics.adminGatedRoutes} />
              <StatChip label="Auth gated" value={analytics.authGatedRoutes} />
            </div>
            <div className="sec-chip-row mt-ds-4">
              {config.roles.filter((r) => r.enabled).map((role) => (
                <span key={role.id} className={cn("sec-chip", context.role === role.id && "sec-chip--active")}>
                  {role.label}
                </span>
              ))}
            </div>
          </section>
        ) : tab === "devices" ? (
          <section className="sec-panel">
            <h2 className="sec-panel__title">Registered Devices</h2>
            <div className="sec-list">
              {context.devices.length === 0 ? (
                <p className="text-sm text-text-muted">No registered devices yet.</p>
              ) : (
                context.devices.map((device) => (
                  <div key={device.id} className="sec-list__row">
                    <div>
                      <p className="font-semibold">{device.label}</p>
                      <p className="text-sm text-text-secondary">{device.platform}</p>
                    </div>
                    {device.trusted ? <span className="sec-chip sec-chip--active">Trusted</span> : null}
                  </div>
                ))
              )}
            </div>
          </section>
        ) : tab === "threat" ? (
          <>
            <section className="sec-panel">
              <h2 className="sec-panel__title">Fraud Detection</h2>
              <div className="sec-chip-row">
                {Object.entries(config.fraudDetection).map(([key, enabled]) => (
                  <span key={key} className={cn("sec-chip", enabled && "sec-chip--active")}>{key}</span>
                ))}
              </div>
            </section>
            <section className="sec-panel">
              <h2 className="sec-panel__title">Platform Security</h2>
              <div className="sec-chip-row">
                {Object.entries(config.platformSecurity).map(([key, enabled]) => (
                  <span key={key} className={cn("sec-chip", enabled && "sec-chip--active")}>{key}</span>
                ))}
              </div>
            </section>
          </>
        ) : tab === "modules" ? (
          <section className="sec-panel">
            <h2 className="sec-panel__title">Security Modules</h2>
            <div className="sec-module-grid">
              {modules.map((module) => (
                <Link key={module.id} href={module.href} className="sec-module-card">
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
            <section className="sec-panel">
              <div className="sec-analytics-grid">
                <MetricCard label="Security score" value={`${dashboard.securityScore}%`} />
                <MetricCard label="MFA enabled" value={dashboard.mfaEnabled ? "Yes" : "No"} />
                <MetricCard label="Active sessions" value={dashboard.activeSessions} />
                <MetricCard label="Devices" value={dashboard.registeredDevices} />
                <MetricCard label="Failed logins (24h)" value={dashboard.failedLogins24h} />
                <MetricCard label="API health" value={`${dashboard.apiHealth}%`} />
                <MetricCard label="Audit events" value={analytics.auditEvents} />
                <MetricCard label="Protections" value={analytics.platformProtections} />
              </div>
            </section>
            <section className="sec-panel">
              <h2 className="sec-panel__title">Authentication Methods</h2>
              <div className="sec-chip-row">
                {config.authMethods.filter((m) => m.enabled).map((method) => (
                  <span key={method.id} className="sec-chip sec-chip--active">{method.label}</span>
                ))}
              </div>
            </section>
            <section className="sec-panel">
              <h2 className="sec-panel__title">Compliance</h2>
              <div className="sec-chip-row">
                {Object.entries(context.compliance).map(([key, enabled]) => (
                  <span key={key} className={cn("sec-chip", enabled && "sec-chip--active")}>
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                ))}
              </div>
              <Link href="/account/privacy" className="sec-link mt-ds-3 inline-block">
                Privacy Center →
              </Link>
            </section>
          </>
        )}
      </HubPageMain>
    </BetaAppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="sec-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="sec-metric-card__value">{value}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="sec-stat-chip">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
