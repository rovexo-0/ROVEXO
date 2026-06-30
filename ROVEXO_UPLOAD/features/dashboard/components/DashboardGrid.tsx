import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DashboardGridProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return <div className={cn("rx-dash-grid", className)}>{children}</div>;
}
