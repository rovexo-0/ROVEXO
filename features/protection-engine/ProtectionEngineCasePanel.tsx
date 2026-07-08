import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ProtectionEngineCaseContext } from "@/lib/protection-engine/types";

type ProtectionEngineCasePanelProps = {
  context: ProtectionEngineCaseContext;
};

export function ProtectionEngineCasePanel({ context }: ProtectionEngineCasePanelProps) {
  const { summary, timeline, evidenceCount } = context;

  return (
    <section className="bp-panel mb-ds-4">
      <div className="bp-panel__head">
        <div>
          <p className="bp-hub__eyebrow">Purchase Protection</p>
          <p className="text-sm text-text-secondary">
            {summary.enterpriseStatus.replace(/-/g, " ")} · {evidenceCount} evidence files
          </p>
        </div>
        <Link href={`/resolution/${summary.caseId}`} className="bp-link">
          Resolution Centre
        </Link>
      </div>

      <div className="bp-timeline">
        {timeline.map((event) => (
          <div
            key={event.id}
            className={cn("bp-timeline__item", event.done && "bp-timeline__item--done", event.current && "bp-timeline__item--current")}
          >
            <span className="bp-timeline__dot" />
            <div>
              <p className="font-semibold text-sm">{event.label}</p>
              {event.timestamp ? <p className="text-xs text-text-muted">{new Date(event.timestamp).toLocaleString()}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
