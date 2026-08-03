import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { listOpenProtectionCases } from "@/lib/protection/service";

export default async function AdminProtectionPage() {
  const cases = await listOpenProtectionCases(100);

  return (
    <div className="space-y-ds-4">
      <div>
        <h2 className="text-xl font-semibold">Protection Cases</h2>
        <p className="text-sm text-text-secondary">{cases.length} open cases requiring review</p>
      </div>

      <div className="space-y-ds-3">
        {cases.map((caseRecord) => (
          <Card key={caseRecord.id} className="flex items-start justify-between gap-ds-4 p-ds-4">
            <div>
              <p className="font-medium capitalize">{caseRecord.caseType.replace("_", " ")}</p>
              <p className="text-sm text-text-secondary">{caseRecord.reason}</p>
              <p className="mt-ds-1 text-xs text-text-muted">
                Status: {caseRecord.status} · Outcome: {caseRecord.outcome}
              </p>
            </div>
            <Link href={`/resolution/${caseRecord.id}`} className="text-sm font-medium text-primary">
              Review
            </Link>
          </Card>
        ))}
        {cases.length === 0 && (
          <Card className="p-ds-4 text-sm text-text-muted">No open protection cases.</Card>
        )}
      </div>
    </div>
  );
}
