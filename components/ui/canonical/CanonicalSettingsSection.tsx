import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CanonicalSettingsSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  intro?: string;
  danger?: boolean;
};

/** Settings-style section — matches Settings subpage (`acm-settings`). */
export function CanonicalSettingsSection({
  title,
  children,
  className,
  intro,
  danger = false,
}: CanonicalSettingsSectionProps) {
  return (
    <section className={cn("acm-settings__section", className)}>
      <h2 className={cn("acm-settings__heading", danger && "acm-settings__heading--danger")}>{title}</h2>
      {intro ? <p className="acm-settings__intro">{intro}</p> : null}
      {children}
    </section>
  );
}

export function CanonicalSettingsCard({ children, className, danger = false }: {
  children: ReactNode;
  className?: string;
  danger?: boolean;
}) {
  return (
    <div className={cn("acm-settings__card", danger && "acm-settings__card--danger", className)}>
      {children}
    </div>
  );
}

export function CanonicalModuleBody({ children, className, flush = false }: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div className={cn("acm-settings pcu-module", flush && "pcu-module--flush", className)} data-pcu-version="v1.0">
      {children}
    </div>
  );
}
