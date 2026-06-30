import Link from "next/link";
import type { MissionControlCounter } from "@/lib/super-admin/mission-control/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type MissionControlLiveCountersProps = {
  counters: MissionControlCounter[];
};

export function MissionControlLiveCounters({ counters }: MissionControlLiveCountersProps) {
  return (
    <div className="mc-counter-grid">
      {counters.map((counter) => {
        const content = (
          <>
            <p className="mc-counter-card__label">{counter.label}</p>
            <div className="mc-counter-card__row">
              <span className="mc-counter-card__value">{counter.value.toLocaleString()}</span>
              {counter.delta ? <span className="mc-counter-card__delta">+{counter.delta}</span> : null}
            </div>
          </>
        );

        return counter.href ? (
          <Link key={counter.id} href={counter.href} className={cn("mc-counter-card", focusRing)}>
            {content}
          </Link>
        ) : (
          <div key={counter.id} className="mc-counter-card">
            {content}
          </div>
        );
      })}
    </div>
  );
}
