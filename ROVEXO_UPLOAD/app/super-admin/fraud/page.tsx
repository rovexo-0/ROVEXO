import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getTrustAnalyticsSummary } from "@/lib/trust/service";
import { listModerationQueue } from "@/lib/moderation/service";

export default async function SuperAdminFraudPage() {
  const [summary, queue] = await Promise.all([getTrustAnalyticsSummary(), listModerationQueue(20)]);

  return (
    <>
      <SuperAdminPageHeader title="Fraud Dashboard" description="Scam reports, moderation risk, and trust signals." />
      <div className="grid gap-ds-3 md:grid-cols-3">
        <Card padding="md" className="bg-white">
          <p className="text-sm text-text-secondary">Pending verifications</p>
          <p className="text-3xl font-bold">{summary.pendingVerifications}</p>
        </Card>
        <Card padding="md" className="bg-white">
          <p className="text-sm text-text-secondary">Moderation queue</p>
          <p className="text-3xl font-bold">{queue.length}</p>
        </Card>
        <Card padding="md" className="bg-white">
          <p className="text-sm text-text-secondary">Average trust score</p>
          <p className="text-3xl font-bold">{Math.round(summary.averageScore)}</p>
        </Card>
      </div>
    </>
  );
}
