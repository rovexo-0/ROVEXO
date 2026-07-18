import Link from "next/link";
import { cn } from "@/lib/cn";
import type { NotificationsEngineNotificationContext } from "@/lib/notifications-engine/types";

type NotificationsEngineNotificationPanelProps = {
  context: NotificationsEngineNotificationContext;
};

export function NotificationsEngineNotificationPanel({ context }: NotificationsEngineNotificationPanelProps) {
  const { summary } = context;

  return (
    <section className="ne-panel mb-ds-3 w-full max-w-none px-ds-4">
      <div className="ne-panel__head">
        <div>
          <p className="ne-hub__eyebrow">Notifications Engine</p>
          <p className="text-sm text-text-secondary">
            {summary.priority} · {summary.enterpriseType} · {summary.read ? "Read" : "Unread"}
          </p>
        </div>
        <Link href="/notifications" className="ne-link">
          Notification Center
        </Link>
      </div>
      <div className="ne-integration-row">
        {context.messagesIntegrated ? <span className="ne-chip ne-chip--active">Messages</span> : null}
        {context.ordersIntegrated ? <span className="ne-chip ne-chip--active">Orders</span> : null}
        {context.paymentsIntegrated ? <span className="ne-chip ne-chip--active">Payments</span> : null}
        {context.shippingIntegrated ? <span className="ne-chip ne-chip--active">Shipping</span> : null}
        {context.walletIntegrated ? <span className="ne-chip ne-chip--active">Wallet</span> : null}
        {context.protectionIntegrated ? (
          <span className={cn("ne-chip", summary.priority === "critical" && "ne-chip--critical")}>Protection</span>
        ) : null}
      </div>
    </section>
  );
}
