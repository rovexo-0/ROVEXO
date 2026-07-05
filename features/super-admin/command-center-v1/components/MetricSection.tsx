"use client";

import type { CommandCenterSection } from "@/lib/super-admin/command-center-v1/types";
import { MetricCard } from "@/features/super-admin/command-center-v1/components/MetricCard";

type MetricSectionProps = {
  section: CommandCenterSection;
};

export function MetricSection({ section }: MetricSectionProps) {
  return (
    <section className="cc1-section" aria-labelledby={`cc1-section-${section.id}`}>
      <header className="cc1-section__header">
        <div>
          <h2 id={`cc1-section-${section.id}`} className="cc1-section__title">
            {section.title}
          </h2>
          {section.subtitle ? <p className="cc1-section__subtitle">{section.subtitle}</p> : null}
        </div>
        <span className="cc1-section__count">{section.metrics.length} metrics</span>
      </header>
      <div className="cc1-section__grid">
        {section.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}
