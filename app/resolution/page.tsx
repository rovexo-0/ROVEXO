import type { Metadata } from "next";
import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { requireAuthContext } from "@/lib/auth/session";
import { listProtectionCasesForUser } from "@/lib/protection/service";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Resolution Centre",
  description: "Manage refund requests, returns, and buyer protection cases on ROVEXO.",
};

export default async function ResolutionCentrePage() {
  const auth = await requireAuthContext();
  const [buyerCases, sellerCases] = await Promise.all([
    listProtectionCasesForUser(auth.user.id, "buyer"),
    listProtectionCasesForUser(auth.user.id, "seller"),
  ]);

  return (
    <BetaAppShell bottomNavTab="account">
      <main className="mx-auto max-w-3xl px-ds-4 py-ds-6">
        <h1 className="text-2xl font-bold">Resolution Centre</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Buyer protection and seller protection cases with evidence, timeline, and appeals.
        </p>

        <section className="mt-ds-6 space-y-ds-3">
          <h2 className="text-lg font-semibold">Your buyer cases</h2>
          {buyerCases.length === 0 ? (
            <Card className="p-ds-4 text-sm text-text-muted">No open buyer cases.</Card>
          ) : (
            buyerCases.map((caseRecord) => (
              <Card key={caseRecord.id} className="p-ds-4">
                <div className="flex items-start justify-between gap-ds-3">
                  <div>
                    <p className="font-medium capitalize">{caseRecord.caseType.replace("_", " ")}</p>
                    <p className="text-sm text-text-secondary">{caseRecord.reason}</p>
                    <p className="mt-ds-1 text-xs text-text-muted">Status: {caseRecord.status}</p>
                  </div>
                  <Link href={`/resolution/${caseRecord.id}`} className="text-sm font-medium text-primary">
                    View
                  </Link>
                </div>
              </Card>
            ))
          )}
        </section>

        <section className="mt-ds-8 space-y-ds-3">
          <h2 className="text-lg font-semibold">Your seller cases</h2>
          {sellerCases.length === 0 ? (
            <Card className="p-ds-4 text-sm text-text-muted">No seller protection cases.</Card>
          ) : (
            sellerCases.map((caseRecord) => (
              <Card key={caseRecord.id} className="p-ds-4">
                <div className="flex items-start justify-between gap-ds-3">
                  <div>
                    <p className="font-medium capitalize">{caseRecord.caseType.replace("_", " ")}</p>
                    <p className="text-sm text-text-secondary">{caseRecord.reason}</p>
                    <p className="mt-ds-1 text-xs text-text-muted">Status: {caseRecord.status}</p>
                  </div>
                  <Link href={`/resolution/${caseRecord.id}`} className="text-sm font-medium text-primary">
                    View
                  </Link>
                </div>
              </Card>
            ))
          )}
        </section>
      </main>
    </BetaAppShell>
  );
}
