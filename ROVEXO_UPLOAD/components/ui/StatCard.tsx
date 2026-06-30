import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export type StatCardProps = HTMLAttributes<HTMLDivElement>;

export function StatCard({ className, children, ...props }: StatCardProps) {
  return (
    <div className={cn("rx-stat-card p-ds-4", className)} {...props}>
      {children}
    </div>
  );
}
