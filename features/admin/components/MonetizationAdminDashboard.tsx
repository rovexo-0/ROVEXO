"use client";

import { Card } from "@/components/ui/Card";
import type { MonetizationPlan } from "@/lib/monetization/types";
import { MONETIZATION_PRODUCTS } from "@/lib/monetization/types";

type MonetizationAdminDashboardProps = {
  plans: MonetizationPlan[];
  promotionRevenueCents: number;
  activeSubscriptions: number;
};

export function MonetizationAdminDashboard({ plans, promotionRevenueCents, activeSubscriptions }: MonetizationAdminDashboardProps) {
  return (
    <div className="space-y-ds-6">
      <h2 className="text-xl font-semibold">Monetization Engine</h2>
      <div className="grid gap-ds-4 sm:grid-cols-3">
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Active subscriptions</p><p className="mt-ds-1 text-3xl font-bold">{activeSubscriptions}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Promotion revenue</p><p className="mt-ds-1 text-3xl font-bold">£{(promotionRevenueCents / 100).toFixed(2)}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Plans</p><p className="mt-ds-1 text-3xl font-bold">{plans.length}</p></Card>
      </div>
      <Card className="p-ds-4">
        <h3 className="font-semibold">Monetization products</h3>
        <ul className="mt-ds-4 grid gap-ds-3 sm:grid-cols-2">
          {MONETIZATION_PRODUCTS.map((product) => (
            <li key={product.id} className="rounded-ds-lg border border-border px-ds-4 py-ds-3">
              <p className="font-medium">{product.title}</p>
              <p className="text-sm text-text-secondary">{product.description}</p>
              <p className="mt-ds-1 text-sm font-medium text-primary">{product.priceLabel}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
