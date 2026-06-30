import type { ReactNode } from "react";
import { DashboardIcon3D, resolveDashboardIconType } from "@/components/icons/DashboardIcon3D";

export function getNavLinkIcon(href: string, className?: string): ReactNode {
  const type = resolveDashboardIconType(href);
  return <DashboardIcon3D type={type} size={32} className={className} />;
}
