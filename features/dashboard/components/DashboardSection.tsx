import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DashboardSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function DashboardSection({ id, title, children, className }: DashboardSectionProps) {
  return (
    <section className={cn("dash-v1-section", className)} aria-labelledby={id}>
      <h2 id={id} className="dash-v1-section__title">
        {title}
      </h2>
      {children}
    </section>
  );
}
