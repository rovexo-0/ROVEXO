"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { OmegaStatusBar } from "@/features/super-admin/components/premium/OmegaStatusBar";
import { EnterpriseDashboardStandard } from "@/features/super-admin/components/premium/EnterpriseDashboardStandard";
import type { EnterpriseDashboardStandardData } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";
import type { OmegaValidationItem } from "@/lib/super-admin/premium/omega-status";

export type EnterpriseAdminRouteTab = { id: string; label: string; href: string };
export type EnterpriseAdminStateTab = { id: string; label: string };

type EnterpriseAdminShellProps = {
  moduleId?: string;
  eyebrow: string;
  title: string;
  description?: string;
  enterpriseScore?: number;
  healthStatus?: "healthy" | "warning" | "critical" | "failed";
  validations?: OmegaValidationItem[];
  routeTabs?: readonly EnterpriseAdminRouteTab[];
  stateTabs?: EnterpriseAdminStateTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  actions?: ReactNode;
  quickLinks?: Array<{ label: string; href: string }>;
  message?: string | null;
  banner?: string | null;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  dashboard?: EnterpriseDashboardStandardData;
  showDashboard?: boolean;
  aiInsight?: string;
  isPending?: boolean;
  children: ReactNode;
};

export function EnterpriseAdminShell({
  moduleId,
  eyebrow,
  title,
  description,
  enterpriseScore = 100,
  healthStatus = "healthy",
  validations,
  routeTabs,
  stateTabs,
  activeTab,
  onTabChange,
  actions,
  quickLinks,
  message,
  banner,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search module data…",
  dashboard,
  showDashboard = false,
  aiInsight,
  isPending,
  children,
}: EnterpriseAdminShellProps) {
  const omegaValidations = validations ?? createOmegaValidations(undefined, healthStatus);

  return (
    <div className="ea-admin" data-module-id={moduleId} aria-busy={isPending}>
      <header className="ea-admin__header">
        <div className="ea-admin__intro">
          <p className="ea-admin__eyebrow">{eyebrow}</p>
          <h2 className="ea-admin__title">{title}</h2>
          {description ? <p className="ea-admin__desc">{description}</p> : null}
        </div>
        <div className="ea-admin__score" aria-label={`Enterprise score ${enterpriseScore} percent`}>
          <strong>{enterpriseScore}%</strong>
          <span>Enterprise Score</span>
        </div>
      </header>

      <OmegaStatusBar enterpriseScore={enterpriseScore} validations={omegaValidations} moduleId={moduleId} />

      {aiInsight ? (
        <aside className="ea-ai-insight" aria-label="AI recommendation">
          <span className="ea-ai-insight__label">OMEGA PRIME</span>
          <p>{aiInsight}</p>
        </aside>
      ) : null}

      {(actions || quickLinks?.length) ? (
        <div className="ea-admin__actions">
          {actions}
          {quickLinks?.map((link) => (
            <Link key={link.href} href={link.href} className="ea-link">
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}

      {onSearchChange ? (
        <div className="ea-toolbar">
          <input
            type="search"
            className="ea-input"
            value={searchQuery ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>
      ) : null}

      {message ? <p className="ea-admin__message" role="status">{message}</p> : null}
      {banner ? <p className="ea-admin__banner" role="status">{banner}</p> : null}

      {routeTabs && routeTabs.length > 0 ? (
        <nav className="ea-tabs" aria-label={`${eyebrow} sections`}>
          {routeTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn("ea-tab", activeTab === tab.id && "ea-tab--active", focusRing)}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {stateTabs && stateTabs.length > 0 ? (
        <nav className="ea-tabs" aria-label={`${eyebrow} sections`}>
          {stateTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn("ea-tab", activeTab === tab.id && "ea-tab--active", focusRing)}
              onClick={() => onTabChange?.(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      ) : null}

      {showDashboard && dashboard ? <EnterpriseDashboardStandard data={dashboard} /> : null}

      <div className="ea-admin__content">{children}</div>
    </div>
  );
}

export function EnterpriseAdminPanel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="ea-panel">
      {title ? <h3 className="ea-panel__title">{title}</h3> : null}
      {children}
    </section>
  );
}

export function EnterpriseAdminList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ea-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
