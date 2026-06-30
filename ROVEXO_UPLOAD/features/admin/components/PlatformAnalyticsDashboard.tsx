"use client";

import { Card } from "@/components/ui/Card";
import type { PlatformAnalyticsSnapshot } from "@/lib/platform-analytics/service";

export function PlatformAnalyticsDashboard({ data }: { data: PlatformAnalyticsSnapshot }) {
  return (
    <div className="space-y-ds-6">
      <h2 className="text-xl font-semibold">Platform Analytics</h2>
      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Total orders</p><p className="mt-ds-1 text-2xl font-bold">{data.orders.totalOrders}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Promotion revenue</p><p className="mt-ds-1 text-2xl font-bold">£{(data.promotions.monthRevenueCents / 100).toFixed(2)}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Avg trust score</p><p className="mt-ds-1 text-2xl font-bold">{data.trust.averageScore}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Wholesale accounts</p><p className="mt-ds-1 text-2xl font-bold">{data.wholesale.accounts}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Open RFQs</p><p className="mt-ds-1 text-2xl font-bold">{data.wholesale.openRfqs}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Active subscriptions</p><p className="mt-ds-1 text-2xl font-bold">{data.monetization.activeSubscriptions}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Monetization plans</p><p className="mt-ds-1 text-2xl font-bold">{data.monetization.plans.length}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Pending verifications</p><p className="mt-ds-1 text-2xl font-bold">{data.trust.pendingVerifications}</p></Card>
      </div>
    </div>
  );
}
