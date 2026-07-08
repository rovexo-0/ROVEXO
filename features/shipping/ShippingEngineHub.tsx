"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { cn } from "@/lib/cn";
import type { ShippingEngineDocument, ShippingEngineModule } from "@/lib/shipping-engine/types";

type ShippingOrderRow = {
  id: string;
  order_number: string;
  status: string;
  delivery_carrier: string | null;
  tracking_number: string | null;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
};

type ShippingEngineHubProps = {
  config: ShippingEngineDocument;
  modules: ShippingEngineModule[];
  orders: ShippingOrderRow[];
};

type HubTab = "manager" | "profiles" | "timeline" | "labels" | "tracking" | "delivery" | "returns";

const TAB_MAP: Record<string, HubTab> = {
  manager: "manager",
  profiles: "profiles",
  timeline: "timeline",
  labels: "labels",
  tracking: "tracking",
  delivery: "delivery",
  returns: "returns",
};

export function ShippingEngineHub({ config, modules, orders }: ShippingEngineHubProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: HubTab = (tabParam && TAB_MAP[tabParam]) || "manager";

  return (
    <div className="se-hub">
      <header className="se-hub__header">
        <div>
          <p className="se-hub__eyebrow">ROVEXO Shipping Engine</p>
          <h1 className="se-hub__title">Shipping Centre</h1>
          <p className="se-hub__meta">
            {config.marketplaceVersion} · {config.primaryCountry} · {config.currency}
          </p>
        </div>
        {config.buyerProtection.enabled ? (
          <div className="se-protection-banner">
            <p className="font-semibold">Purchase Protection active</p>
            <p className="text-sm text-text-secondary">
              Funds remain protected until delivery confirmation or platform resolution.
            </p>
          </div>
        ) : null}
      </header>

      <div className="se-hub__tabs">
        {(
          [
            ["manager", "Manager"],
            ["profiles", "Profiles"],
            ["timeline", "Timeline"],
            ["tracking", "Tracking"],
            ["labels", "Labels"],
            ["delivery", "Delivery"],
            ["returns", "Returns"],
          ] as const
        ).map(([id, label]) => (
          <Link
            key={id}
            href={`/shipping?tab=${id}`}
            className={cn("se-hub__tab", activeTab === id && "se-hub__tab--active")}
          >
            {label}
          </Link>
        ))}
      </div>

      {activeTab === "manager" ? (
        <section className="se-panel">
          <h2 className="se-panel__title">Shipping Manager</h2>
          <div className="se-module-grid">
            {modules.map((module) => (
              <Link key={module.id} href={module.href} className="se-module-card">
                <span className="se-module-card__icon"><ModuleIcon href={module.href} id={module.id} /></span>
                <p className="font-semibold">{module.label}</p>
                <p className="text-sm text-text-secondary">{module.description}</p>
              </Link>
            ))}
          </div>
          <h3 className="se-panel__subtitle">Active shipments</h3>
          <div className="se-list">
            {orders.length === 0 ? <p className="text-sm text-text-muted">No active shipments.</p> : null}
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="se-list__row se-list__row--link">
                <div>
                  <p className="font-semibold">{order.order_number}</p>
                  <p className="text-sm text-text-secondary">{order.status.replace(/_/g, " ")}</p>
                </div>
                {order.tracking_number ? <span className="se-chip">{order.tracking_number}</span> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "profiles" ? (
        <section className="se-panel">
          <h2 className="se-panel__title">Shipping Profiles</h2>
          <div className="se-profile-grid">
            {(["buyer", "seller", "business"] as const).map((type) => (
              <div key={type} className="se-card">
                <p className="font-semibold capitalize">{type}</p>
                <p className="text-sm text-text-secondary">Shipping, return, and collection addresses</p>
                <Link href={type === "seller" ? "/account/seller/shipping" : "/account/addresses"} className="se-link">
                  Manage {type} profile
                </Link>
              </div>
            ))}
          </div>
          {config.addressValidation.blockUntilConfirmed ? (
            <p className="se-note">Address confirmation is required before payment (buyer) and dispatch (seller).</p>
          ) : null}
        </section>
      ) : null}

      {activeTab === "timeline" || activeTab === "tracking" ? (
        <section className="se-panel">
          <h2 className="se-panel__title">{activeTab === "timeline" ? "Shipping Timeline" : "Tracking Engine"}</h2>
          <p className="se-panel__desc">Open an order to view the complete carrier-independent shipment timeline.</p>
          <div className="se-list">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="se-list__row se-list__row--link">
                <div>
                  <p className="font-semibold">{order.order_number}</p>
                  <p className="text-sm text-text-secondary">
                    {order.delivery_carrier ?? "Carrier pending"} · {order.status.replace(/_/g, " ")}
                  </p>
                </div>
                <span className="se-chip">View timeline</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "labels" ? (
        <section className="se-panel">
          <h2 className="se-panel__title">Shipping Labels</h2>
          <p className="se-panel__desc">Seller own label, carrier label, and future ROVEXO label support.</p>
          <div className="se-chip-row">
            <span className="se-chip se-chip--active">Seller Own Label</span>
            <span className="se-chip">Carrier Label</span>
            <span className="se-chip">Future ROVEXO Label</span>
          </div>
          <p className="se-note">Generate printable labels from seller order pages.</p>
        </section>
      ) : null}

      {activeTab === "delivery" ? (
        <section className="se-panel">
          <h2 className="se-panel__title">Delivery Confirmation</h2>
          <div className="se-card-grid">
            <div className="se-card">
              <p className="font-semibold">Buyer</p>
              <p className="text-sm text-text-secondary">Confirm delivery · Report problem · Package not received</p>
            </div>
            <div className="se-card">
              <p className="font-semibold">Seller</p>
              <p className="text-sm text-text-secondary">Confirm dispatch · Upload tracking · Update status</p>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "returns" ? (
        <section className="se-panel">
          <h2 className="se-panel__title">Returns</h2>
          <p className="se-panel__desc">Return request → seller approval → return label → refund flow.</p>
          <div className="se-list">
            {config.returnRules.map((rule) => (
              <div key={rule.id} className="se-list__row">
                <p className="font-semibold">{rule.label}</p>
                <span className={cn("se-chip", rule.enabled && "se-chip--active")}>{rule.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="se-panel">
        <h2 className="se-panel__title">Available Methods · UK</h2>
        <div className="se-chip-row">
          {config.methods.filter((m) => m.enabled).map((method) => (
            <span key={method.id} className="se-chip se-chip--active">
              {method.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
