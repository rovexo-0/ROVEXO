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
    <section className={cn("rx-dash-section", className)} aria-labelledby={id}>
      <h2 id={id} className="rx-dash-section__title">
        {title}
      </h2>
      {children}
    </section>
  );
}
