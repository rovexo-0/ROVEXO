import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CanonicalSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  titleId?: string;
};

/** Section + uppercase label — matches My Account hub (`ac-canonical__section`). */
export function CanonicalSection({ title, children, className, titleId }: CanonicalSectionProps) {
  const id = titleId ?? `pcu-section-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section className={cn("ac-canonical__section", className)} aria-labelledby={id}>
      <h2 id={id} className="ac-canonical__section-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CanonicalSectionCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("ac-canonical__section-card", className)}>{children}</div>;
}
