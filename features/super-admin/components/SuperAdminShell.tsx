"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SUPER_ADMIN_NAV } from "@/lib/super-admin/nav";
import { buildSuperAdminBreadcrumbs, isOmegaReadyPath } from "@/lib/super-admin/premium";
import { SuperAdminBadge } from "@/features/auth/components/SuperAdminBadge";
import {
  SuperAdminBreadcrumbs,
  SuperAdminCommandPalette,
  SuperAdminStatusBadge,
  useSuperAdminCommandPalette,
} from "@/features/super-admin/components/premium";
import { focusRing } from "@/components/ui/tokens";

type SuperAdminShellProps = {
  children: ReactNode;
};

function NavSection({
  section,
  pathname,
  onNavigate,
}: {
  section: (typeof SUPER_ADMIN_NAV)[number];
  pathname: string;
  onNavigate: () => void;
}) {
  const isDevelopment = section.id === "development";
  const sectionActive = isDevelopment && pathname.startsWith("/super-admin/development");
  const [collapsed, setCollapsed] = useState(isDevelopment && !sectionActive);

  return (
    <div className="sa-premium-section">
      <div className="sa-premium-section__title">
        <span>{section.title}</span>
        {section.collapsible ? (
          <button
            type="button"
            className={cn("sa-premium-section__toggle", focusRing)}
            onClick={() => setCollapsed((open) => !open)}
            aria-expanded={!collapsed}
          >
            {collapsed ? "Show" : "Hide"}
          </button>
        ) : null}
      </div>
      {!collapsed ? (
        <ul className="space-y-ds-1">
          {section.items.map((item) => {
            const active =
              item.href === "/super-admin"
                ? pathname === "/super-admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn("sa-premium-nav-link", active && "sa-premium-nav-link--active", focusRing)}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                >
                  <span aria-hidden className="mt-0.5 text-base">{item.icon}</span>
                  <span>
                    <span className="sa-premium-nav-link__label">{item.label}</span>
                    {item.description ? (
                      <span className="sa-premium-nav-link__desc">{item.description}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const commandPalette = useSuperAdminCommandPalette();
  const isMissionControlHome = pathname === "/super-admin";
  const breadcrumbs = useMemo(() => buildSuperAdminBreadcrumbs(pathname), [pathname]);
  const omegaReady = isOmegaReadyPath(pathname);

  return (
    <div className="sa-premium-shell rx-page min-h-screen bg-background text-text-primary">
      <header className="sa-premium-header">
        <div className="sa-premium-header__inner">
          <div className="sa-premium-header__brand">
            <div className="flex flex-wrap items-center gap-ds-2">
              <p className="sa-premium-header__eyebrow">
                {isMissionControlHome ? "Mission Control" : "ROVEXO Super Admin"}
              </p>
              <SuperAdminBadge compact />
              {omegaReady ? <SuperAdminStatusBadge label="Ready" status="healthy" omega /> : null}
            </div>
            <p className="sa-premium-header__subtitle">
              {isMissionControlHome
                ? "Central operating system for the marketplace"
                : "Enterprise control center — Premium 2026"}
            </p>
          </div>
          <div className="sa-premium-header__actions">
            <button
              type="button"
              className={cn("sa-premium-search-trigger", focusRing)}
              onClick={() => commandPalette.setOpen(true)}
              aria-label="Open command palette"
            >
              <span>Search modules & pages</span>
              <span className="sa-premium-kbd">Ctrl K</span>
            </button>
            <Link href="/super-admin/search" className={cn("hidden text-sm font-medium text-text-secondary hover:text-primary sm:inline", focusRing)}>
              Global Search
            </Link>
            <Link href="/" className={cn("hidden text-sm font-medium text-text-secondary hover:text-primary sm:inline", focusRing)}>
              Marketplace
            </Link>
            <button
              type="button"
              className={cn("rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm font-medium lg:hidden", focusRing)}
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      <div className="sa-premium-layout">
        <aside className={cn("sa-premium-sidebar", !mobileOpen && "sa-premium-sidebar--closed lg:block")}>
          <nav className="sa-premium-sidebar__nav" aria-label="Super Admin">
            {SUPER_ADMIN_NAV.map((section) => (
              <NavSection
                key={section.id}
                section={section}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>
        </aside>

        <main className="sa-premium-main">
          <SuperAdminBreadcrumbs items={breadcrumbs} />
          {children}
        </main>
      </div>

      <SuperAdminCommandPalette open={commandPalette.open} onClose={commandPalette.close} />
    </div>
  );
}

export function SuperAdminPageHeader({
  title,
  description,
  actions,
  omegaReady: omegaReadyOverride,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  omegaReady?: boolean;
}) {
  const pathname = usePathname();
  const omegaReady = omegaReadyOverride ?? isOmegaReadyPath(pathname);

  return (
    <header className="sa-premium-page-header">
      <div>
        <h1 className="sa-premium-page-header__title">{title}</h1>
        {description ? <p className="sa-premium-page-header__desc">{description}</p> : null}
      </div>
      <div className="sa-premium-page-header__meta">
        {omegaReady ? <SuperAdminStatusBadge label="Ready" status="healthy" omega /> : null}
        {actions}
      </div>
    </header>
  );
}
