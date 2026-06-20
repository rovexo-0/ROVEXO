import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { DeliveryStage } from "@/lib/orders/types";

type DeliveryStatusCardProps = {
  stages: DeliveryStage[];
  carrier: string;
};

function formatTimestamp(value?: string): string | null {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DeliveryStatusCard({ stages, carrier }: DeliveryStatusCardProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-ds-4 shadow-ds-soft">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Delivery Status</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">Carrier: {carrier}</p>
      </div>

      <ol className="flex flex-col gap-ds-4">
        {stages.map((stage, index) => {
          const timestamp = formatTimestamp(stage.timestamp);

          return (
            <li key={stage.id} className="flex gap-ds-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-ds-full text-xs font-bold",
                    stage.done
                      ? "bg-success/10 text-success"
                      : "bg-surface-muted text-text-muted",
                    stage.current && stage.done && "ring-2 ring-success/30",
                  )}
                  aria-hidden
                >
                  {stage.done ? "✓" : index + 1}
                </span>
                {index < stages.length - 1 && (
                  <span
                    className={cn(
                      "mt-ds-1 w-0.5 flex-1 min-h-[24px] rounded-ds-full",
                      stage.done ? "bg-success/30" : "bg-border",
                    )}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-ds-1 pt-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    stage.done ? "text-text-primary" : "text-text-muted",
                  )}
                >
                  {stage.label}
                </p>
                {timestamp && <p className="mt-ds-1 text-xs text-text-secondary">{timestamp}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
