"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SUPER_ADMIN_NAV } from "@/lib/super-admin/nav";
import { SuperAdminBadge } from "@/features/auth/components/SuperAdminBadge";
import { focusRing } from "@/components/ui/tokens";

type SuperAdminShellProps = {
  children: ReactNode;
};

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between gap-ds-3 px-ds-4 py-ds-3">
          <div>
            <div className="flex flex-wrap items-center gap-ds-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                ROVEXO Super Admin
              </p>
              <SuperAdminBadge compact />
            </div>
            <p className="text-sm text-text-secondary">Single-account platform control</p>
          </div>
          <div className="flex items-center gap-ds-2">
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

      <div className="mx-auto flex w-full max-w-[1440px]">
        <aside
          className={cn(
            "w-full shrink-0 border-r border-border bg-white lg:block lg:w-72",
            mobileOpen ? "block" : "hidden",
          )}
        >
          <nav className="max-h-[calc(100dvh-72px)] overflow-y-auto p-ds-3">
            {SUPER_ADMIN_NAV.map((section) => (
              <div key={section.id} className="mb-ds-4">
                <p className="mb-ds-2 px-ds-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  {section.title}
                </p>
                <ul className="space-y-ds-1">
                  {section.items.map((item) => {
                    const active =
                      item.href === "/super-admin"
                        ? pathname === "/super-admin"
                        : pathname.startsWith(item.href);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-start gap-ds-2 rounded-ds-lg px-ds-3 py-ds-2 transition-colors",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                            focusRing,
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          <span aria-hidden className="mt-0.5 text-base">{item.icon}</span>
                          <span>
                            <span className="block text-sm font-semibold">{item.label}</span>
                            {item.description ? (
                              <span className="block text-xs opacity-80">{item.description}</span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-ds-4 py-ds-6">{children}</main>
      </div>
    </div>
  );
}

export function SuperAdminPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-ds-6">
      <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
      {description ? <p className="mt-ds-2 max-w-3xl text-sm text-text-secondary">{description}</p> : null}
    </div>
  );
}
