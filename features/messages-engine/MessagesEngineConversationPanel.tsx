import Link from "next/link";
import { cn } from "@/lib/cn";
import type { MessagesEngineConversationContext } from "@/lib/messages-engine/types";

type MessagesEngineConversationPanelProps = {
  context: MessagesEngineConversationContext;
};

export function MessagesEngineConversationPanel({ context }: MessagesEngineConversationPanelProps) {
  const { summary, messageCount } = context;

  return (
    <section className="me-panel mx-auto mb-ds-3 max-w-2xl px-ds-4">
      <div className="me-panel__head">
        <div>
          <p className="me-hub__eyebrow">Messages Engine</p>
          <p className="text-sm text-text-secondary">
            {summary.enterpriseStatus} · {messageCount} messages · {summary.conversationType.replace(/-/g, " ")}
          </p>
        </div>
        <Link href="/messages" className="me-link">
          Conversation Center
        </Link>
      </div>

      <div className="me-integration-row">
        {context.ordersIntegrated ? <span className="me-chip me-chip--active">Orders</span> : null}
        {context.listingsIntegrated ? <span className="me-chip me-chip--active">Listings</span> : null}
        {context.shippingIntegrated ? <span className="me-chip me-chip--active">Shipping</span> : null}
        {context.protectionIntegrated ? <span className={cn("me-chip", summary.blocked && "me-chip--warn")}>Protection</span> : null}
      </div>
    </section>
  );
}
