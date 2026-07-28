"use client";

/**
 * ROVEXO v1.0 — Dynamic Transaction Status Card
 * PRESENTATION ONLY — renders resolveTransactionStatusCard model.
 * All actions must go through runOrderAction via onAction.
 */

import { AccountIcon } from "@/components/account/AccountIcons";
import { cn } from "@/lib/cn";
import type {
  TransactionStatusCardActionId,
  TransactionStatusCardModel,
} from "@/lib/inbox/transaction-status-card-v1";

export type TransactionStatusCardProps = {
  status: TransactionStatusCardModel["status"];
  title: string;
  description: string;
  icon: TransactionStatusCardModel["icon"];
  primaryAction: TransactionStatusCardModel["primaryAction"];
  secondaryAction: TransactionStatusCardModel["secondaryAction"];
  busy?: boolean;
  onAction: (actionId: TransactionStatusCardActionId) => void;
};

export function TransactionStatusCard({
  status,
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  busy = false,
  onAction,
}: TransactionStatusCardProps) {
  const hasPrimary = Boolean(primaryAction);
  const hasSecondary = Boolean(secondaryAction);

  return (
    <section
      className={cn(
        "conv-hub__tx-status",
        (hasPrimary || hasSecondary) && "conv-hub__tx-status--with-action",
      )}
      data-transaction-status-card="v1.0"
      data-master-stack-layer="ORDER_STATUS_CARD"
      data-tx-status={status}
      aria-label={title}
    >
      <span className="conv-hub__tx-status-icon" aria-hidden>
        <AccountIcon name={icon} className="conv-hub__tx-status-icon-svg" />
      </span>
      <div className="conv-hub__tx-status-copy">
        <p className="conv-hub__tx-status-title">{title}</p>
        <p className="conv-hub__tx-status-text">{description}</p>
      </div>
      {primaryAction || secondaryAction ? (
        <div className="conv-hub__tx-status-actions">
          {primaryAction ? (
            <button
              type="button"
              className="conv-hub__tx-status-action"
              disabled={busy}
              onClick={() => onAction(primaryAction.id)}
            >
              {busy ? "…" : primaryAction.label}
            </button>
          ) : null}
          {secondaryAction ? (
            <button
              type="button"
              className="conv-hub__tx-status-action conv-hub__tx-status-action--secondary"
              disabled={busy}
              onClick={() => onAction(secondaryAction.id)}
            >
              {busy ? "…" : secondaryAction.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
