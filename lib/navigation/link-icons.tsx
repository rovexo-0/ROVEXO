"use client";

import type { ReactNode } from "react";
import { DashboardIcon3D } from "@/components/icons/DashboardIcon3D";
import { resolveDashboardIconType } from "@/lib/icons/resolve-dashboard-icon-type";

export function getNavLinkIcon(href: string, className?: string): ReactNode {
  const type = resolveDashboardIconType(href);
  return <DashboardIcon3D type={type} size={32} className={className} />;
}
