import Link from "next/link";
import { cn } from "@/lib/cn";
import type { OrdersEngineOrderContext } from "@/lib/orders-engine/types";

type OrdersEngineOrderPanelProps = {
  context: OrdersEngineOrderContext;
};

export function OrdersEngineOrderPanel({ context }: OrdersEngineOrderPanelProps) {
  const { summary, timeline, documents } = context;

  return (
    <section className="oe-panel mb-ds-4">
      <div className="oe-panel__head">
        <div>
          <p className="oe-hub__eyebrow">Orders Engine</p>
          <p className="text-sm text-text-secondary">
            {summary.lifecycleStage.replace(/-/g, " ")} · {summary.protectionStatus} · {summary.walletStatus}
          </p>
        </div>
        {context.shippingIntegrated ? (
          <Link href="/shipping" className="oe-link">
            Shipping
          </Link>
        ) : null}
      </div>

      <div className="oe-timeline">
        {timeline.map((event) => (
          <div key={event.id} className={cn("oe-timeline__item", event.done && "oe-timeline__item--done", event.current && "oe-timeline__item--current")}>
            <span className="oe-timeline__dot" />
            <div>
              <p className="font-semibold text-sm">{event.label}</p>
              {event.timestamp ? <p className="text-xs text-text-muted">{new Date(event.timestamp).toLocaleString()}</p> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="oe-chip-row mt-ds-4">
        {documents.filter((d) => d.available).map((doc) => (
          <span key={doc.id} className="oe-chip oe-chip--active">
            {doc.label}
          </span>
        ))}
      </div>
    </section>
  );
}
