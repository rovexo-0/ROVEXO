"use client";

import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";
import { cn } from "@/lib/cn";
import {
  resolveDashboardIconType,
  type DashboardIconType,
} from "@/lib/icons/resolve-dashboard-icon-type";

export type { DashboardIconType };
export { resolveDashboardIconType };

type DashboardIcon3DProps = {
  type: DashboardIconType;
  className?: string;
  size?: number;
};

export function DashboardIcon3D({ type, className, size = 32 }: DashboardIcon3DProps) {
  return <Fluency3DIcon icon={type} size={size} className={cn("shrink-0", className)} />;
}
