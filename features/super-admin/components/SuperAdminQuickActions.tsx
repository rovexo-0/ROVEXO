"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type QuickAction = {
  label: string;
  action: string;
  needsUser?: boolean;
  needsProduct?: boolean;
  needsOrder?: boolean;
  needsAmount?: boolean;
  needsMessage?: boolean;
  enabled?: boolean;
  variant?: "danger" | "default";
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Grant Featured", action: "grant_featured", needsUser: true, needsProduct: true },
  { label: "Grant Bump", action: "grant_bump", needsUser: true, needsProduct: true },
  { label: "Grant Premium", action: "grant_premium", needsUser: true },
  { label: "Grant Lifetime Premium", action: "grant_lifetime_premium", needsUser: true },
  { label: "Verify Seller", action: "verify_user", needsUser: true },
  { label: "Verify Company", action: "verify_company", needsUser: true },
  { label: "Credit Wallet", action: "credit_wallet", needsUser: true, needsAmount: true },
  { label: "Refund Payment", action: "refund_payment", needsOrder: true },
  { label: "Suspend User", action: "suspend_user", needsUser: true, variant: "danger" },
  { label: "Restore User", action: "restore_user", needsUser: true },
  { label: "Send Push Notification", action: "send_push_notification", needsUser: true, needsMessage: true },
  { label: "Send Email Notification", action: "send_email_notification", needsUser: true, needsMessage: true },
  { label: "Enable Maintenance Mode", action: "maintenance_mode", enabled: true, variant: "danger" },
  { label: "Disable Maintenance Mode", action: "maintenance_mode", enabled: false },
  { label: "Create Backup", action: "create_backup" },
];

type SuperAdminQuickActionsProps = {
  compact?: boolean;
};

export function SuperAdminQuickActions({ compact = false }: SuperAdminQuickActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [productId, setProductId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");

  async function runCommand(item: QuickAction) {
    setMessage(null);
    setBusy(item.action + String(item.enabled));

    const body: Record<string, unknown> = {
      action: item.action,
      enabled: item.enabled,
    };

    if (item.needsUser) {
      if (!userId.trim()) {
        setMessage("User ID is required for this action.");
        setBusy(null);
        return;
      }
      body.userId = userId.trim();
    }
    if (item.needsProduct) {
      if (!productId.trim()) {
        setMessage("Product ID is required for this action.");
        setBusy(null);
        return;
      }
      body.productId = productId.trim();
    }
    if (item.needsOrder) {
      if (!orderId.trim()) {
        setMessage("Order ID is required for this action.");
        setBusy(null);
        return;
      }
      body.orderId = orderId.trim();
    }
    if (item.needsAmount) {
      const parsed = Number(amount);
      if (!Number.isFinite(parsed) || parsed === 0) {
        setMessage("Enter a valid wallet credit amount.");
        setBusy(null);
        return;
      }
      body.amount = parsed;
      body.message = notifyBody || "Super Admin wallet credit";
    }
    if (item.needsMessage) {
      body.title = notifyTitle || "ROVEXO update";
      body.subtitle = notifyBody || "Important platform notification.";
    }

    const response = await fetch("/api/super-admin/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    setMessage(
      response.ok
        ? payload.message ?? `${item.label} completed.`
        : payload.error ?? "Action failed.",
    );
    setBusy(null);
  }

  return (
    <div className="space-y-ds-4">
      <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Action targets</h3>
        <div className="mt-ds-3 grid gap-ds-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="User ID"
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          />
          <input
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            placeholder="Product ID"
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          />
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Order ID"
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          />
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Wallet amount (£)"
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          />
          <input
            value={notifyTitle}
            onChange={(event) => setNotifyTitle(event.target.value)}
            placeholder="Notification title"
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm md:col-span-2"
          />
          <input
            value={notifyBody}
            onChange={(event) => setNotifyBody(event.target.value)}
            placeholder="Notification message / reason"
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm md:col-span-2"
          />
        </div>
      </Card>

      <div className={compact ? "grid gap-ds-2 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-ds-3 md:grid-cols-2 xl:grid-cols-3"}>
        {QUICK_ACTIONS.map((item) => (
          <Card key={`${item.action}-${String(item.enabled)}`} padding="md" className="bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <p className="font-semibold text-text-primary">{item.label}</p>
            <Button
              className="mt-ds-3"
              fullWidth
              size={compact ? "sm" : "md"}
              variant={item.variant === "danger" ? "secondary" : "primary"}
              disabled={busy === item.action + String(item.enabled)}
              onClick={() => void runCommand(item)}
            >
              {busy === item.action + String(item.enabled) ? "Running…" : "Run"}
            </Button>
          </Card>
        ))}
      </div>

      {message ? <p className="text-sm font-medium text-primary">{message}</p> : null}
    </div>
  );
}
