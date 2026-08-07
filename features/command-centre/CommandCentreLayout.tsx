"use client";

/* P0-02: Enterprise/Admin CSS — load only with Command Centre (not marketplace megabundle). */
import "@/styles/rovexo/enterprise-admin-entry.css";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import { ChevronRightLineIcon, ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { SuperAdminNavItem } from "@/lib/super-admin/nav-types";
import {
  getCommandCentreAppearanceServerSnapshot,
  getCommandCentreAppearanceSnapshot,
  resolveCommandCentreHomeHref,
  resolveCommandCentreTitle,
  setCommandCentreAppearance,
  subscribeCommandCentreAppearance,
  type CommandCentreVariant,
} from "@/lib/command-centre/command-centre-unified-theme-v1";
import { buildSuperAdminBreadcrumbs, isOmegaReadyPath } from "@/lib/super-admin/premium";
import {
  SuperAdminBreadcrumbs,
  SuperAdminCommandPalette,
  SuperAdminStatusBadge,
  useSuperAdminCommandPalette,
} from "@/features/super-admin/components/premium";

const SIDEBAR_ICONS: Record<string, AccountIconName> = {
  "layout-dashboard": "analytics",
  radio: "tracking",
  users: "profile",
  tag: "promotions",
  package: "orders",
  "credit-card": "payment",
  mail: "messages",
  scale: "legal",
  star: "reviews",
  lightbulb: "ideas",
  "bar-chart-3": "analytics",
  shield: "security",
  settings: "settings",
  hexagon: "business",
  "flask-conical": "product",
};

export type CommandCentreLayoutProps = {
  children: ReactNode;
  variant: CommandCentreVariant;
  navItems: readonly SuperAdminNavItem[];
  /** Super Admin only — OMEGA footer + command palette. */
  enableSuperAdminTools?: boolean;
};

function CommandCentreSidebar({
  pathname,
  collapsed,
  navItems,
  homeHref,
  brandTitle,
  showOmega,
  onNavigate,
  onToggleCollapse,
}: {
  pathname: string;
  collapsed: boolean;
  navItems: readonly SuperAdminNavItem[];
  homeHref: string;
  brandTitle: string;
  showOmega: boolean;
  onNavigate: () => void;
  onToggleCollapse: () => void;
}) {
  return (
    <nav
      className={cn("cc2-sidebar__nav", collapsed && "cc2-sidebar__nav--collapsed")}
      aria-label={brandTitle}
    >
      <div className="cc2-sidebar__brand">
        <strong>ROVEXO</strong>
      </div>
      <ul className="cc2-sidebar__list">
        {navItems.map((item) => {
          const icon = SIDEBAR_ICONS[item.icon ?? ""] ?? "analytics";
          const active =
            item.href === homeHref
              ? pathname === homeHref
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
                <AccountIcon name={icon} className="cc2-sidebar__icon h-[18px] w-[18px]" />
                {!collapsed ? (
                  <span className="cc2-sidebar__label">
                    {item.label}
                    {item.description === "LIVE" ? (
                      <span className="cc2-sidebar__live">LIVE</span>
                    ) : null}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="cc2-sidebar__footer">
        {showOmega ? (
          <Link
            href="/super-admin/observability/omega"
            className="cc2-sidebar__omega"
            onClick={onNavigate}
          >
            <AccountIcon name="business" className="h-5 w-5" />
            {!collapsed ? (
              <span>
                <strong>OMEGA / SENTINEL</strong>
                <small>System Guardian</small>
              </span>
            ) : null}
          </Link>
        ) : null}
        <button type="button" className="cc2-sidebar__collapse" onClick={onToggleCollapse}>
          <ChevronRightLineIcon
            className={cn("h-4 w-4", collapsed && "is-flipped")}
            style={collapsed ? undefined : { transform: "rotate(180deg)" }}
          />
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </nav>
  );
}

/**
 * ONE canonical Command Centre shell — White Theme default · Dark optional.
 * Admin and Super Admin share this component; only nav + title differ by role.
 */
export function CommandCentreLayout({
  children,
  variant,
  navItems,
  enableSuperAdminTools = false,
}: CommandCentreLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const appearance = useSyncExternalStore(
    subscribeCommandCentreAppearance,
    getCommandCentreAppearanceSnapshot,
    getCommandCentreAppearanceServerSnapshot,
  );
  const commandPalette = useSuperAdminCommandPalette(enableSuperAdminTools);
  const homeHref = resolveCommandCentreHomeHref(variant);
  const title = resolveCommandCentreTitle(variant);
  const isHome = pathname === homeHref;
  const breadcrumbs = useMemo(
    () => (variant === "super_admin" ? buildSuperAdminBreadcrumbs(pathname) : []),
    [pathname, variant],
  );
  const omegaReady = enableSuperAdminTools && isOmegaReadyPath(pathname);

  return (
    <div
      data-universal-ui="v1.1"
      data-command-centre="unified-v1"
      data-command-centre-variant={variant}
      data-cc-appearance={appearance}
      suppressHydrationWarning
      className={cn(
        "cc-unified sa-premium-shell rx-page min-h-screen text-text-primary",
        "cc2-shell",
        isHome && "cc2-shell--home",
      )}
    >
      <header className="sa-premium-header cc-unified__header">
        <div className="sa-premium-header__inner">
          <div className="sa-premium-header__brand">
            <div className="flex flex-wrap items-center gap-ds-2">
              <p className="sa-premium-header__eyebrow cc-unified__title">
                <ShieldLineIcon className="cc-unified__title-icon" aria-hidden />
                <span>{title}</span>
              </p>
              {omegaReady ? <SuperAdminStatusBadge label="Ready" status="healthy" omega /> : null}
            </div>
          </div>
          <div className="sa-premium-header__actions">
            <div className="cc2-theme-toggle" role="group" aria-label="Command Centre theme">
              <button
                type="button"
                className={cn(
                  "cc2-theme-toggle__btn cc-unified__theme-btn",
                  appearance === "light" && "cc2-theme-toggle__btn--active",
                  focusRing,
                )}
                aria-pressed={appearance === "light"}
                aria-label="White theme"
                onClick={() => setCommandCentreAppearance("light")}
              >
                White
              </button>
              <button
                type="button"
                className={cn(
                  "cc2-theme-toggle__btn cc-unified__theme-btn",
                  appearance === "dark" && "cc2-theme-toggle__btn--active",
                  focusRing,
                )}
                aria-pressed={appearance === "dark"}
                aria-label="Dark theme"
                onClick={() => setCommandCentreAppearance("dark")}
              >
                Dark
              </button>
            </div>
            {enableSuperAdminTools ? (
              <button
                type="button"
                className={cn("sa-premium-search-trigger", focusRing)}
                onClick={() => commandPalette.setOpen(true)}
                aria-label="Open command palette"
              >
                <span>Search modules & pages</span>
                <span className="sa-premium-kbd">Ctrl K</span>
              </button>
            ) : null}
            <button
              type="button"
              className={cn(
                "cc-unified__menu-btn rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm font-medium lg:hidden",
                focusRing,
              )}
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-controls="cc-unified-sidebar"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      <div className={cn("cc2-layout", sidebarCollapsed && "cc2-layout--collapsed")}>
        {mobileOpen ? (
          <button
            type="button"
            className="cc-unified__backdrop lg:hidden"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <aside
          id="cc-unified-sidebar"
          className={cn(
            "cc2-sidebar",
            !mobileOpen && "cc2-sidebar--closed",
            sidebarCollapsed && "cc2-sidebar--collapsed",
          )}
        >
          <CommandCentreSidebar
            pathname={pathname}
            collapsed={sidebarCollapsed}
            navItems={navItems}
            homeHref={homeHref}
            brandTitle={title}
            showOmega={enableSuperAdminTools}
            onNavigate={() => setMobileOpen(false)}
            onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          />
        </aside>

        <main className={cn("cc2-main", isHome && "cc2-main--home", "cc-unified__main")}>
          {!isHome && breadcrumbs.length > 0 ? (
            <SuperAdminBreadcrumbs items={breadcrumbs} />
          ) : null}
          {children}
        </main>
      </div>

      {enableSuperAdminTools ? (
        <SuperAdminCommandPalette open={commandPalette.open} onClose={commandPalette.close} />
      ) : null}
    </div>
  );
}
