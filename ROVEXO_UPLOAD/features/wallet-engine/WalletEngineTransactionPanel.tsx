import Link from "next/link";
import { cn } from "@/lib/cn";
import type { WalletEngineTransactionContext } from "@/lib/wallet-engine/types";

type WalletEngineTransactionPanelProps = {
  context: WalletEngineTransactionContext;
};

export function WalletEngineTransactionPanel({ context }: WalletEngineTransactionPanelProps) {
  const { summary, timeline } = context;

  return (
    <section className="we-panel mb-ds-4">
      <div className="we-panel__head">
        <div>
          <p className="we-hub__eyebrow">Wallet Engine</p>
          <p className="text-sm text-text-secondary">
            {summary.type.replace(/-/g, " ")} · {summary.status}
          </p>
        </div>
        <div className="flex gap-ds-3">
          {context.ordersIntegrated ? (
            <Link href="/orders" className="we-link">
              Orders
            </Link>
          ) : null}
          {context.shippingIntegrated ? (
            <Link href="/shipping" className="we-link">
              Shipping
            </Link>
          ) : null}
        </div>
      </div>

      <div className="we-timeline">
        {timeline.map((event) => (
          <div
            key={event.id}
            className={cn("we-timeline__item", event.done && "we-timeline__item--done", event.current && "we-timeline__item--current")}
          >
            <span className="we-timeline__dot" />
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
