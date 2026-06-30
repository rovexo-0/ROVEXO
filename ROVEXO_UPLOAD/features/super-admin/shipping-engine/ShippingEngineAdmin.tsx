"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseEngineAdminShell } from "@/features/super-admin/components/premium/EnterpriseEngineAdminShell";
import { cn } from "@/lib/cn";
import type { ShippingEngineDocument, ShippingEngineHistoryEntry, ShippingEngineSnapshot } from "@/lib/shipping-engine/types";

type ShippingEngineAdminProps = {
  initialSnapshot: ShippingEngineSnapshot;
};

type AdminTab = "methods" | "zones" | "rules" | "carriers" | "returns" | "tracking" | "notifications" | "analytics" | "protection" | "history";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "methods", label: "Methods" },
  { id: "zones", label: "Zones" },
  { id: "rules", label: "Rules" },
  { id: "carriers", label: "Carriers" },
  { id: "returns", label: "Returns" },
  { id: "tracking", label: "Tracking" },
  { id: "notifications", label: "Notifications" },
  { id: "analytics", label: "Analytics" },
  { id: "protection", label: "Buyer Protection" },
  { id: "history", label: "History" },
];

export function ShippingEngineAdmin({ initialSnapshot }: ShippingEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<AdminTab>("methods");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "duplicate" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/shipping-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: ShippingEngineDocument;
          snapshot?: ShippingEngineSnapshot;
          error?: string;
          document?: ShippingEngineDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Shipping Engine action failed.");
          return;
        }
        if (data.draft) {
          setDraft(data.draft);
          setSnapshot((c) => ({ ...c, draft: data.draft! }));
        }
        if (data.snapshot) setSnapshot(data.snapshot);
        if (action === "export" && data.document) {
          const blob = new Blob([JSON.stringify(data.document, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const anchor = window.document.createElement("a");
          anchor.href = url;
          anchor.download = `rovexo-shipping-engine-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Shipping configuration published." : "Action complete.");
      });
    },
    [draft],
  );

  return (
    <EnterpriseEngineAdminShell
      moduleId="shipping-engine"
      eyebrow="Shipping Engine Core"
      subtitle={`Carrier-independent logistics foundation · ${draft.marketplaceVersion} · ${draft.primaryCountry} · ${draft.currency}`}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as AdminTab)}
      actions={
        <>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("reset-draft")}>Reset</Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("export")}>Export</Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("save-draft")}>Save Draft</Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("publish")}>Publish</Button>
        </>
      }
      message={message}
      isPending={isPending}
    >
      {activeTab === "methods" ? (
        <AdminList title="Shipping Methods" items={draft.methods.map((m) => ({ name: m.label, meta: `${m.estimatedDays.min}–${m.estimatedDays.max} days`, enabled: m.enabled }))} />
      ) : null}
      {activeTab === "zones" ? (
        <AdminList title="Shipping Zones" items={draft.zones.map((z) => ({ name: z.label, meta: z.countryCodes.join(", "), enabled: z.enabled }))} />
      ) : null}
      {activeTab === "rules" ? (
        <AdminList title="Shipping Rules" items={draft.rules.map((r) => ({ name: r.name, meta: r.condition, enabled: r.enabled }))} />
      ) : null}
      {activeTab === "carriers" ? (
        <AdminList title="Carrier Settings (integration-ready)" items={draft.carriers.map((c) => ({ name: c.name, meta: c.integrationReady ? "Integration ready" : "Architecture prepared", enabled: c.enabled }))} />
      ) : null}
      {activeTab === "returns" ? (
        <AdminList title="Return Rules" items={draft.returnRules.map((r) => ({ name: r.label, meta: r.autoApprovalDays ? `${r.autoApprovalDays} day auto-approval` : "Manual approval", enabled: r.enabled }))} />
      ) : null}
      {activeTab === "tracking" ? (
        <AdminList title="Tracking Rules" items={draft.trackingRules.map((r) => ({ name: r.label, meta: r.requireTrackingBeforeDispatch ? "Tracking required" : "Optional tracking", enabled: r.notifyOnStatusChange }))} />
      ) : null}
      {activeTab === "notifications" ? (
        <AdminList title="Shipping Notifications" items={draft.notifications.map((n) => ({ name: n.event, meta: n.audience, enabled: n.enabled }))} />
      ) : null}
      {activeTab === "analytics" ? (
        <AdminList title="Analytics (prepared)" items={draft.analyticsMetrics.map((m) => ({ name: m.label, meta: m.ready ? "Ready" : "Future", enabled: m.ready }))} />
      ) : null}
      {activeTab === "protection" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Buyer Protection Integration</h2>
          <div className="ea-chip-row">
            <span className={cn("ea-chip", draft.buyerProtection.enabled && "ea-chip--active")}>Protection enabled</span>
            <span className={cn("ea-chip", draft.buyerProtection.fundsProtectedUntilDeliveryConfirmed && "ea-chip--active")}>Funds protected until confirmation</span>
            <span className={cn("ea-chip", draft.buyerProtection.integratesWithWallet && "ea-chip--active")}>Wallet</span>
            <span className={cn("ea-chip", draft.buyerProtection.integratesWithOrders && "ea-chip--active")}>Orders</span>
            <span className={cn("ea-chip", draft.buyerProtection.integratesWithPayments && "ea-chip--active")}>Payments</span>
          </div>
          <div className="ea-chip-row mt-ds-4">
            <span className={cn("ea-chip", draft.addressValidation.buyerConfirmBeforePayment && "ea-chip--active")}>Buyer address before payment</span>
            <span className={cn("ea-chip", draft.addressValidation.sellerConfirmBeforeDispatch && "ea-chip--active")}>Seller address before dispatch</span>
          </div>
        </section>
      ) : null}
      {activeTab === "history" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Configuration History</h2>
          <div className="mc-theme-studio__history">
            {snapshot.history.map((entry: ShippingEngineHistoryEntry) => (
              <div key={entry.id} className="mc-theme-studio__history-row">
                <div>
                  <p className="font-semibold">{entry.label}</p>
                  <p className="text-sm text-text-secondary">{new Date(entry.publishedAt).toLocaleString()}</p>
                </div>
                {entry.rollbackAvailable ? (
                  <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("rollback", entry.id)}>Rollback</Button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <p className="se-note">
        Public shipping hub: <Link href="/shipping" className="ea-link">/shipping</Link>
      </p>
    </EnterpriseEngineAdminShell>
  );
}

function AdminList({ title, items }: { title: string; items: { name: string; meta: string; enabled: boolean }[] }) {
  return (
    <section className="ea-panel">
      <h2 className="ea-panel__title">{title}</h2>
      <div className="ea-list">
        {items.map((item) => (
          <div key={item.name} className="se-list__row">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-text-secondary">{item.meta}</p>
            </div>
            <span className={cn("ea-chip", item.enabled && "ea-chip--active")}>{item.enabled ? "Enabled" : "Disabled"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
