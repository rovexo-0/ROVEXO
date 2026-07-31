"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isOmegaReadyPath } from "@/lib/super-admin/premium";
import { SuperAdminStatusBadge } from "@/features/super-admin/components/premium";

/** Preserved Super Admin page header — shared premium tokens (White Theme RC1). */
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
