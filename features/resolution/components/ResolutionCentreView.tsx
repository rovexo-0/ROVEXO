import { AccountCanonicalShell } from "@/features/account-canonical";
import { CanonicalSection, CanonicalSectionCard } from "@/components/ui/canonical";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import Link from "next/link";
import type { ProtectionCase } from "@/lib/protection/service";

type ResolutionCentreViewProps = {
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

export function ResolutionCentreView({ buyerCases, sellerCases }: ResolutionCentreViewProps) {
  return (
    <AccountCanonicalShell
      title="Returns & Refunds"
      backHref="/account"
      backLabel="My Account"
      showHeaderTitle
      showBottomNav={false}
    >
      <div className="flex w-full flex-col gap-ds-4 px-ds-4 pb-ds-5">
        <p className="text-sm text-text-secondary">
          Buyer and seller protection cases with evidence and appeals.
        </p>
        <CaseSection title="Your buyer cases" cases={buyerCases} emptyLabel="No open buyer cases." />
        <CaseSection
          title="Your seller cases"
          cases={sellerCases}
          emptyLabel="No seller protection cases."
        />
      </div>
    </AccountCanonicalShell>
  );
}

/** @deprecated Prefer ResolutionCentreView — kept for any external imports. */
export function ResolutionMobileContent(props: ResolutionCentreViewProps) {
  return <ResolutionCentreView {...props} />;
}

/** @deprecated Prefer ResolutionCentreView — kept for any external imports. */
export function ResolutionDesktopContent(props: ResolutionCentreViewProps) {
  return <ResolutionCentreView {...props} />;
}
