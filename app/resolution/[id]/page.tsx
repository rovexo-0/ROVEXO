import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { ProtectionCaseActions } from "@/features/protection/components/ProtectionCaseActions";
import { requireAuthContext, getUserRole } from "@/lib/auth/session";
import { getProtectionCase, listProtectionCaseEvents } from "@/lib/protection/service";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

type ResolutionCasePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ResolutionCasePageProps): Promise<Metadata> {
  const { id } = await params;
  const caseRecord = await getProtectionCase(id);
  return {
    ...privatePageMetadata,
    title: caseRecord ? `Case ${caseRecord.caseType} · Resolution Centre` : "Case not found",
  };
}

export default async function ResolutionCasePage({ params }: ResolutionCasePageProps) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const role = await getUserRole(auth.user.id);
  const [caseRecord, events] = await Promise.all([getProtectionCase(id), listProtectionCaseEvents(id)]);

  if (!caseRecord) {
    notFound();
  }

  if (caseRecord.buyerId !== auth.user.id && caseRecord.sellerId !== auth.user.id && role !== "admin") {
    notFound();
  }

  return (
    <BetaAppShell bottomNavTab="account">
      <main className="mx-auto max-w-3xl px-ds-4 py-ds-6">
        <Link href="/resolution" className="text-sm text-primary">
          ← Back to Resolution Centre
        </Link>
        <h1 className="mt-ds-4 text-2xl font-bold capitalize">{caseRecord.caseType.replace("_", " ")} case</h1>
        <p className="mt-ds-1 text-sm text-text-secondary">{caseRecord.reason}</p>

        <Card className="mt-ds-6 space-y-ds-2 p-ds-4">
          <p className="text-sm">
            <span className="font-medium">Status:</span> {caseRecord.status}
          </p>
          <p className="text-sm">
            <span className="font-medium">Outcome:</span> {caseRecord.outcome.replace("_", " ")}
          </p>
          {caseRecord.description && (
            <p className="text-sm text-text-secondary">{caseRecord.description}</p>
          )}
          {caseRecord.adminNotes && (
            <p className="text-sm text-text-secondary">
              <span className="font-medium">Admin decision:</span> {caseRecord.adminNotes}
            </p>
          )}
        </Card>

        <ProtectionCaseActions caseId={caseRecord.id} isAdmin={role === "admin"} status={caseRecord.status} />

        <section className="mt-ds-8">
          <h2 className="text-lg font-semibold">Case timeline</h2>
          <ul className="mt-ds-4 space-y-ds-3">
            {events.map((event) => (
              <li key={event.id} className="border-l-2 border-primary/30 pl-ds-4">
                <p className="text-sm font-medium capitalize">{event.eventType.replace("_", " ")}</p>
                <p className="text-sm text-text-secondary">{event.message}</p>
                <p className="text-xs text-text-muted">{new Date(event.createdAt).toLocaleString("en-GB")}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </BetaAppShell>
  );
}
