import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DashboardGridProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return <div className={cn("dash-v1-grid", className)}>{children}</div>;
}
