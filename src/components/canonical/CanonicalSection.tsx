import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CanonicalSectionProps = {
  title: string;
  children: ReactNode;
  intro?: string;
  className?: string;
  titleId?: string;
  danger?: boolean;
  /** When true, children render inside the My Account section card surface. */
  card?: boolean;
};

/**
 * My Account section — uppercase label, 6px gap, optional grouped card surface.
 */
export function CanonicalSection({
  title,
  children,
  intro,
  className,
  titleId,
  danger = false,
  card = false,
}: CanonicalSectionProps) {
  const id = titleId ?? `cds-section-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className={cn("cds-section", className)} aria-labelledby={id}>
      <h2 id={id} className={cn("cds-section__title", danger && "cds-section__title--danger")}>
        {title}
      </h2>
      {intro ? <p className="cds-section__intro">{intro}</p> : null}
      {card ? <div className="cds-section__card">{children}</div> : children}
    </section>
  );
}
