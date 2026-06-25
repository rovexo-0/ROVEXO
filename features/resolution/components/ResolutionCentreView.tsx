import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { MobileHubSections } from "@/features/mobile-ui";
import { ResponsiveShell } from "@/features/mobile-ui";
import { getSupportHubSections } from "@/lib/mobile-ui/hubs";
import Link from "next/link";
import type { ProtectionCase } from "@/lib/protection/service";

type ResolutionMobileContentProps = {
  buyerCases: ProtectionCase[];
  sellerCases: ProtectionCase[];
};

function CaseGrid({
  title,
  cases,
  emptyLabel,
}: {
  title: string;
  cases: ProtectionCase[];
  emptyLabel: string;
}) {
  if (!cases.length) {
    return (
      <section className="mhub-section">
        <h2 className="mhub-section__title">{title}</h2>
        <Card padding="md" className="text-sm text-text-muted">
          {emptyLabel}
        </Card>
      </section>
    );
  }

  return (
    <section className="mhub-section">
      <h2 className="mhub-section__title">{title}</h2>
      <div className="mhub-grid">
        {cases.map((caseRecord) => (
          <Link
            key={caseRecord.id}
            href={`/resolution/${caseRecord.id}`}
            className="mhub-card"
            aria-label={`${caseRecord.caseType} case`}
          >
            <p className="mhub-card__title capitalize">{caseRecord.caseType.replace("_", " ")}</p>
            <p className="mhub-card__subtitle">{caseRecord.reason}</p>
            <p className="mt-ds-2 text-xs text-text-muted">Status: {caseRecord.status}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ResolutionMobileContent({ buyerCases, sellerCases }: ResolutionMobileContentProps) {
  return (
    <div className="flex flex-col gap-ds-4">
      <section className="mhub-hero">
        <h1 className="text-2xl font-bold text-text-primary">Resolution Centre</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Buyer and seller protection cases with evidence and appeals.
        </p>
      </section>
      <MobileHubSections
        sections={getSupportHubSections().filter((s) => s.id === "support")}
      />
      <CaseGrid title="Your buyer cases" cases={buyerCases} emptyLabel="No open buyer cases." />
      <CaseGrid title="Your seller cases" cases={sellerCases} emptyLabel="No seller protection cases." />
    </div>
  );
}

export function ResolutionDesktopContent({ buyerCases, sellerCases }: ResolutionMobileContentProps) {
  return (
    <>
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
    </>
  );
}

export function ResolutionCentreView({ buyerCases, sellerCases }: ResolutionMobileContentProps) {
  return (
    <BetaAppShell bottomNavTab="account">
      <main className="mx-auto max-w-3xl px-ds-4 py-ds-6 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <ResponsiveShell
          mobile={<ResolutionMobileContent buyerCases={buyerCases} sellerCases={sellerCases} />}
          desktop={<ResolutionDesktopContent buyerCases={buyerCases} sellerCases={sellerCases} />}
        />
      </main>
    </BetaAppShell>
  );
}
