import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { CanonicalModuleBody, CanonicalSection, CanonicalSectionCard } from "@/components/ui/canonical";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { MobileHubNavigator } from "@/features/mobile-ui";
import { ResponsiveShell } from "@/features/mobile-ui";
import Link from "next/link";
import type { ProtectionCase } from "@/lib/protection/service";

type ResolutionMobileContentProps = {
  buyerCases: ProtectionCase[];
  sellerCases: ProtectionCase[];
};

function CaseSection({
  title,
  cases,
  emptyLabel,
}: {
  title: string;
  cases: ProtectionCase[];
  emptyLabel: string;
}) {
  return (
    <CanonicalSection title={title}>
      <CanonicalSectionCard>
        {cases.length === 0 ? (
          <p className="px-ds-4 py-ds-5 text-sm text-text-secondary">{emptyLabel}</p>
        ) : (
          cases.map((caseRecord) => (
            <Link
              key={caseRecord.id}
              href={`/resolution/${caseRecord.id}`}
              className="ac-canonical__row"
              aria-label={`${caseRecord.caseType} case`}
            >
              <span className="ac-canonical__row-copy">
                <span className="ac-canonical__row-title">
                  <span className="truncate capitalize">{caseRecord.caseType.replace("_", " ")}</span>
                </span>
                <span className="ac-canonical__row-subtitle">{caseRecord.reason}</span>
                <span className="ac-canonical__row-subtitle">Status: {caseRecord.status}</span>
              </span>
              <span className="ac-canonical__row-chevron" aria-hidden>
                <ChevronRightLineIcon />
              </span>
            </Link>
          ))
        )}
      </CanonicalSectionCard>
    </CanonicalSection>
  );
}

export function ResolutionMobileContent({ buyerCases, sellerCases }: ResolutionMobileContentProps) {
  return (
    <>
      <p className="pcu-intro">
        Buyer and seller protection cases with evidence and appeals.
      </p>
      <MobileHubNavigator defaultHub="support" startExpanded sectionTitle="Support hubs" />
      <CaseSection title="Your buyer cases" cases={buyerCases} emptyLabel="No open buyer cases." />
      <CaseSection title="Your seller cases" cases={sellerCases} emptyLabel="No seller protection cases." />
    </>
  );
}

export function ResolutionDesktopContent({ buyerCases, sellerCases }: ResolutionMobileContentProps) {
  return (
    <>
      <p className="pcu-intro">
        Purchase protection and seller protection cases with evidence, timeline, and appeals.
      </p>
      <CaseSection title="Your buyer cases" cases={buyerCases} emptyLabel="No open buyer cases." />
      <CaseSection title="Your seller cases" cases={sellerCases} emptyLabel="No seller protection cases." />
    </>
  );
}

export function ResolutionCentreView({ buyerCases, sellerCases }: ResolutionMobileContentProps) {
  return (
    <BetaAppShell bottomNavTab="account">
      <CanonicalPageHeader title="Resolution Centre" backHref="/account" backLabel="My Account" />
      <CanonicalModuleBody flush>
        <ResponsiveShell
          mobile={<ResolutionMobileContent buyerCases={buyerCases} sellerCases={sellerCases} />}
          desktop={<ResolutionDesktopContent buyerCases={buyerCases} sellerCases={sellerCases} />}
        />
      </CanonicalModuleBody>
    </BetaAppShell>
  );
}
