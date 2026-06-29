import Link from "next/link";
import { cn } from "@/lib/cn";
import type { PaymentsEnginePaymentContext } from "@/lib/payments-engine/types";

type PaymentsEnginePaymentPanelProps = {
  context: PaymentsEnginePaymentContext;
};

export function PaymentsEnginePaymentPanel({ context }: PaymentsEnginePaymentPanelProps) {
  const { summary, timeline, verification, documents } = context;

  return (
    <section className="pe-panel mb-ds-4">
      <div className="pe-panel__head">
        <div>
          <p className="pe-hub__eyebrow">Payments Engine</p>
          <p className="text-sm text-text-secondary">
            {summary.status.replace(/-/g, " ")} · {summary.provider.replace(/-/g, " ")} · {verification.status}
          </p>
        </div>
        <div className="flex gap-ds-3">
          {context.walletIntegrated ? (
            <Link href="/wallet" className="pe-link">
              Wallet
            </Link>
          ) : null}
          {context.ordersIntegrated ? (
            <Link href="/orders" className="pe-link">
              Orders
            </Link>
          ) : null}
        </div>
      </div>

      <div className="pe-timeline">
        {timeline.map((event) => (
          <div
            key={event.id}
            className={cn("pe-timeline__item", event.done && "pe-timeline__item--done", event.current && "pe-timeline__item--current")}
          >
            <span className="pe-timeline__dot" />
            <div>
              <p className="font-semibold text-sm">{event.label}</p>
              {event.timestamp ? <p className="text-xs text-text-muted">{new Date(event.timestamp).toLocaleString()}</p> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="pe-chip-row mt-ds-4">
        {documents.filter((d) => d.available).map((doc) => (
          <span key={doc.id} className="pe-chip pe-chip--active">
            {doc.label}
          </span>
        ))}
      </div>
    </section>
  );
}
