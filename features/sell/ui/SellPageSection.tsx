import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SellPageSection({
  title,
  id,
  children,
  className,
}: {
  title: string;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section id={id} className={cn("sell-page-section", className)} aria-labelledby={titleId}>
      <h2 id={titleId} className="cds-section__title">
        {title}
      </h2>
      {children}
    </section>
  );
}
