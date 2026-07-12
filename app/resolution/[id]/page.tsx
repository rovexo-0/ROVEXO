import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { Card } from "@/components/ui/Card";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { ProtectionCaseActions } from "@/features/protection/components/ProtectionCaseActions";
import { getUserRole, isPlatformAdminRole, requireAuthContext } from "@/lib/auth/session";
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

  if (
    caseRecord.buyerId !== auth.user.id &&
    caseRecord.sellerId !== auth.user.id &&
    !isPlatformAdminRole(role ?? "buyer")
  ) {
    notFound();
  }

  const title = `${caseRecord.caseType.replace("_", " ")} case`;

  return (
    <BetaAppShell bottomNavTab="account">
      <CanonicalPageHeader title={title} backHref="/resolution" backLabel="Resolution Centre" />
      <ScrollContainer className="flex-1">
        <main className="mx-auto max-w-3xl px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
          <p className="text-sm text-text-secondary">{caseRecord.reason}</p>

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

          <ProtectionCaseActions
            caseId={caseRecord.id}
            isAdmin={isPlatformAdminRole(role ?? "buyer")}
            status={caseRecord.status}
          />

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
      </ScrollContainer>
    </BetaAppShell>
  );
}
