import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DashboardShellProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardShell({ children, className }: DashboardShellProps) {
  return <div className={cn("dash-v1-shell", className)}>{children}</div>;
}
