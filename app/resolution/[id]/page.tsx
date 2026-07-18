import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { ProtectionCaseActions } from "@/features/protection/components/ProtectionCaseActions";
import { getUserRole, isPlatformAdminRole, requireAuthContext } from "@/lib/auth/session";
import { getProtectionCase, listProtectionCaseEvents } from "@/lib/protection/service";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

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
    <AccountCanonicalShell
      title={title}
      backHref="/resolution"
      backLabel="Resolution Centre"
      showHeaderTitle
      showBottomNav={false}
      intro={caseRecord.reason}
    >
      <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5">
        <CanonicalSection title="Case details">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Status" value={caseRecord.status} showChevron={false} />
            <CanonicalMenuRow
              title="Outcome"
              value={caseRecord.outcome.replace("_", " ")}
              showChevron={false}
            />
            {caseRecord.description ? (
              <CanonicalMenuRow
                title="Description"
                description={caseRecord.description}
                showChevron={false}
              />
            ) : null}
            {caseRecord.adminNotes ? (
              <CanonicalMenuRow
                title="Admin decision"
                description={caseRecord.adminNotes}
                showChevron={false}
              />
            ) : null}
          </CanonicalCard>
        </CanonicalSection>

        <ProtectionCaseActions
          caseId={caseRecord.id}
          isAdmin={isPlatformAdminRole(role ?? "buyer")}
          status={caseRecord.status}
        />

        <CanonicalSection title="Case timeline">
          <CanonicalCard variant="list">
            {events.length ? (
              events.map((event) => (
                <CanonicalMenuRow
                  key={event.id}
                  title={event.eventType.replace("_", " ")}
                  description={event.message}
                  value={new Date(event.createdAt).toLocaleString("en-GB")}
                  showChevron={false}
                />
              ))
            ) : (
              <CanonicalMenuRow title="No timeline events yet." showChevron={false} hideChevron />
            )}
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
