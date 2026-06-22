"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrustReviewActions } from "@/features/admin/components/TrustReviewActions";
import type { TrustVerification } from "@/lib/trust/types";

type TrustAdminDashboardProps = {
  summary: { pendingVerifications: number; averageScore: number; approvedVerifications: number };
  pending: TrustVerification[];
};

export function TrustAdminDashboard({ summary, pending }: TrustAdminDashboardProps) {
  return (
    <div className="space-y-ds-6">
      <h2 className="text-xl font-semibold">Trust Center Administration</h2>
      <div className="grid gap-ds-4 sm:grid-cols-3">
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Pending verifications</p><p className="mt-ds-1 text-3xl font-bold">{summary.pendingVerifications}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Average trust score</p><p className="mt-ds-1 text-3xl font-bold">{summary.averageScore}</p></Card>
        <Card className="p-ds-4"><p className="text-sm text-text-secondary">Approved verifications</p><p className="mt-ds-1 text-3xl font-bold">{summary.approvedVerifications}</p></Card>
      </div>
      <Card className="p-ds-4">
        <h3 className="font-semibold">Moderator review queue</h3>
        <ul className="mt-ds-4 space-y-ds-4 text-sm">
          {pending.length ? pending.map((item) => (
            <li key={item.id} className="rounded-ds-lg border border-border p-ds-4">
              <div className="flex flex-wrap items-center justify-between gap-ds-3">
                <div>
                  <p className="font-medium capitalize">{item.verificationType.replace(/_/g, " ")}</p>
                  <p className="text-text-secondary">User {item.userId.slice(0, 8)}…</p>
                </div>
                <Badge>{item.status}</Badge>
              </div>
              <div className="mt-ds-3">
                <TrustReviewActions verification={item} />
              </div>
            </li>
          )) : <li className="text-text-secondary">No pending verifications</li>}
        </ul>
      </Card>
    </div>
  );
}
