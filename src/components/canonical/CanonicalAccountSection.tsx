import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { canonicalAccountClasses } from "./CanonicalAccountTokens";

export type CanonicalAccountSectionProps = {
  title: string;
  children: ReactNode;
  intro?: string;
  className?: string;
  titleId?: string;
  system?: boolean;
};

/**
 * My Account menu section — `ac-canonical__section` + title + optional intro.
 * Pair with `CanonicalAccountSectionCard` for the grouped row surface.
 */
export function CanonicalAccountSection({
  title,
  children,
  intro,
  className,
  titleId,
  system = false,
}: CanonicalAccountSectionProps) {
  const id = titleId ?? `aca-section-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section
      className={cn(
        canonicalAccountClasses.section,
        system && canonicalAccountClasses.sectionSystem,
        className,
      )}
      aria-labelledby={id}
    >
      <h2 id={id} className={canonicalAccountClasses.sectionTitle}>
        {title}
      </h2>
      {intro ? <p className={canonicalAccountClasses.intro}>{intro}</p> : null}
      {children}
    </section>
  );
}

export type CanonicalAccountSectionCardProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

/** My Account grouped row card — `ac-canonical__section-card`. */
export function CanonicalAccountSectionCard({
  children,
  className,
  id,
}: CanonicalAccountSectionCardProps) {
  return (
    <div id={id} className={cn(canonicalAccountClasses.sectionCard, className)}>
      {children}
    </div>
  );
}
