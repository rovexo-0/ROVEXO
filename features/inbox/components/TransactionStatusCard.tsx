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
  trackingDetail?: TransactionStatusCardModel["trackingDetail"];
  resolutionCase?: TransactionStatusCardModel["resolutionCase"];
  informationHint?: boolean;
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
  trackingDetail = null,
  resolutionCase = null,
  informationHint = false,
  busy = false,
  onAction,
}: TransactionStatusCardProps) {
  const hasPrimary = Boolean(primaryAction);
  const hasSecondary = Boolean(secondaryAction);
  const isCompactTracking =
    Boolean(trackingDetail) && primaryAction?.id === "track_parcel";
  const visibleTitle = isCompactTracking && trackingDetail ? trackingDetail.activityTitle : title;
  const visibleDescription =
    isCompactTracking && trackingDetail ? trackingDetail.activityDescription : description;

  return (
    <section
      className={cn(
        "conv-hub__tx-status-stack",
        resolutionCase && "conv-hub__tx-status-stack--with-case",
      )}
      data-transaction-status-card="v1.0"
      data-master-stack-layer="ORDER_STATUS_CARD"
      data-tx-status={status}
      aria-label={visibleTitle}
    >
      <div
        className={cn(
          "conv-hub__tx-status",
          (hasPrimary || hasSecondary) && "conv-hub__tx-status--with-action",
          isCompactTracking && "conv-hub__tx-status--tracking-compact",
        )}
        data-tx-status={status}
        data-tx-tracking-compact={isCompactTracking ? "true" : undefined}
      >
        <span className="conv-hub__tx-status-icon" aria-hidden>
          <AccountIcon name={icon} className="conv-hub__tx-status-icon-svg" />
        </span>
        <div className="conv-hub__tx-status-copy">
          <p className="conv-hub__tx-status-title">{visibleTitle}</p>
          <p className="conv-hub__tx-status-text">{visibleDescription}</p>
          {trackingDetail ? (
            <p
              className="conv-hub__tx-status-tracking-meta"
              data-tx-tracking="canonical"
            >
              {trackingDetail.carrierTracking}
            </p>
          ) : null}
        </div>
        {primaryAction || secondaryAction ? (
          <div className="conv-hub__tx-status-actions">
            {primaryAction ? (
              <button
                type="button"
                className={cn(
                  "conv-hub__tx-status-action",
                  isCompactTracking && "conv-hub__tx-status-action--compact",
                )}
                disabled={busy}
                onClick={() => onAction(primaryAction.id)}
              >
                {busy ? "…" : primaryAction.label}
              </button>
            ) : null}
            {secondaryAction ? (
              <button
                type="button"
                className={cn(
                  "conv-hub__tx-status-action",
                  secondaryAction.id === "cancel_order"
                    ? "conv-hub__tx-status-action--cancel"
                    : "conv-hub__tx-status-action--secondary",
                )}
                disabled={busy}
                onClick={() => onAction(secondaryAction.id)}
              >
                {busy ? "…" : secondaryAction.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {resolutionCase ? (
        <aside
          className="conv-hub__resolution-case"
          data-non-delivery-resolution-case="v1"
          data-non-delivery-status={resolutionCase.statusLabel}
          data-add-information-active={informationHint ? "true" : undefined}
          aria-label={resolutionCase.title}
        >
          <div className="conv-hub__resolution-case-head">
            <p className="conv-hub__resolution-case-title">{resolutionCase.title}</p>
            <span className="conv-hub__resolution-case-status">{resolutionCase.statusLabel}</span>
          </div>
          <p className="conv-hub__resolution-case-body">{resolutionCase.body}</p>
          <div className="conv-hub__resolution-case-actions">
            {resolutionCase.actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="conv-hub__resolution-case-action"
                data-non-delivery-action={action.id}
                data-add-information-open={
                  action.id === "add_information" && informationHint ? "true" : undefined
                }
                disabled={busy}
                onClick={() => onAction(action.id)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  );
}
