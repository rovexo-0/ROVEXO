"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  ChevronLeft,
  CreditCard,
  Hexagon,
  LayoutDashboard,
  Lightbulb,
  Mail,
  Package,
  Radio,
  Scale,
  Settings,
  Shield,
  Star,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { COMMAND_CENTER_SIDEBAR_NAV } from "@/lib/super-admin/nav";
import { buildSuperAdminBreadcrumbs, isOmegaReadyPath } from "@/lib/super-admin/premium";
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

const SIDEBAR_ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  radio: Radio,
  users: Users,
  tag: Tag,
  package: Package,
  "credit-card": CreditCard,
  mail: Mail,
  scale: Scale,
  star: Star,
  lightbulb: Lightbulb,
  "bar-chart-3": BarChart3,
  shield: Shield,
  settings: Settings,
  hexagon: Hexagon,
};

function CommandCenterSidebar({
  pathname,
  collapsed,
  onNavigate,
  onToggleCollapse,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
  onToggleCollapse: () => void;
}) {
  return (
    <nav className={cn("cc2-sidebar__nav", collapsed && "cc2-sidebar__nav--collapsed")} aria-label="Super Admin">
      <div className="cc2-sidebar__brand">
        <strong>ROVEXO</strong>
      </div>
      <ul className="cc2-sidebar__list">
        {COMMAND_CENTER_SIDEBAR_NAV.map((item) => {
          const Icon = SIDEBAR_ICONS[item.icon ?? ""] ?? LayoutDashboard;
          const active =
            item.href === "/super-admin"
              ? pathname === "/super-admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("cc2-sidebar__link", active && "cc2-sidebar__link--active", focusRing)}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="cc2-sidebar__icon" />
                {!collapsed ? (
                  <span className="cc2-sidebar__label">
                    {item.label}
                    {item.description === "LIVE" ? <span className="cc2-sidebar__live">LIVE</span> : null}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="cc2-sidebar__footer">
        <Link href="/super-admin/observability/omega" className="cc2-sidebar__omega" onClick={onNavigate}>
          <Hexagon size={20} />
          {!collapsed ? (
            <span>
              <strong>OMEGA / SENTINEL</strong>
              <small>System Guardian</small>
            </span>
          ) : null}
        </Link>
        <button type="button" className="cc2-sidebar__collapse" onClick={onToggleCollapse}>
          <ChevronLeft size={16} className={collapsed ? "is-flipped" : undefined} />
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </nav>
  );
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const commandPalette = useSuperAdminCommandPalette();
  const isMissionControlHome = pathname === "/super-admin";
  const breadcrumbs = useMemo(() => buildSuperAdminBreadcrumbs(pathname), [pathname]);
  const omegaReady = isOmegaReadyPath(pathname);

  return (
    <div
      className={cn(
        "sa-premium-shell rx-page min-h-screen text-text-primary",
        isMissionControlHome ? "cc2-shell cc2-shell--home" : "bg-background",
      )}
    >
      {!isMissionControlHome ? (
        <header className="sa-premium-header">
          <div className="sa-premium-header__inner">
            <div className="sa-premium-header__brand">
              <div className="flex flex-wrap items-center gap-ds-2">
                <p className="sa-premium-header__eyebrow">ROVEXO Super Admin</p>
                {omegaReady ? <SuperAdminStatusBadge label="Ready" status="healthy" omega /> : null}
              </div>
              <p className="sa-premium-header__subtitle">Enterprise control center — Premium 2026</p>
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
      ) : null}

      <div className={cn("cc2-layout", sidebarCollapsed && "cc2-layout--collapsed")}>
        <aside
          className={cn(
            "cc2-sidebar",
            !mobileOpen && "cc2-sidebar--closed",
            sidebarCollapsed && "cc2-sidebar--collapsed",
          )}
        >
          <CommandCenterSidebar
            pathname={pathname}
            collapsed={sidebarCollapsed}
            onNavigate={() => setMobileOpen(false)}
            onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          />
          {isMissionControlHome ? (
            <button
              type="button"
              className="cc2-sidebar__mobile-toggle lg:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
            >
              Menu
            </button>
          ) : null}
        </aside>

        <main className={cn("cc2-main", isMissionControlHome && "cc2-main--home")}>
          {!isMissionControlHome ? <SuperAdminBreadcrumbs items={breadcrumbs} /> : null}
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
