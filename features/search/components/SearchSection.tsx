import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SearchSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function SearchSection({ title, children, className }: SearchSectionProps) {
  return (
    <section className={cn("px-ds-4 py-ds-3", className)} aria-labelledby={undefined}>
      <h2 className="mb-ds-3 text-sm font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}
