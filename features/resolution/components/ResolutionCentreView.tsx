import { AccountCanonicalShell } from "@/features/account-canonical";
import { CanonicalSection, CanonicalSectionCard } from "@/components/ui/canonical";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import Link from "next/link";
import type { ProtectionCase, ProtectionCaseType } from "@/lib/protection/service";

type ResolutionCentreViewProps = {
  buyerCases: ProtectionCase[];
  sellerCases: ProtectionCase[];
  filterType?: ProtectionCaseType | null;
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

function filterCases(cases: ProtectionCase[], filterType?: ProtectionCaseType | null) {
  if (!filterType) return cases;
  return cases.filter((entry) => entry.caseType === filterType);
}

export function ResolutionCentreView({
  buyerCases,
  sellerCases,
  filterType = null,
}: ResolutionCentreViewProps) {
  const buyer = filterCases(buyerCases, filterType);
  const seller = filterCases(sellerCases, filterType);
  const title =
    filterType === "refund"
      ? "Refunds"
      : filterType === "dispute"
        ? "Disputes"
        : "Returns & Refunds";
  const intro =
    filterType === "refund"
      ? "Your refund cases."
      : filterType === "dispute"
        ? "Your dispute cases."
        : "Buyer and seller protection cases.";

  const fromBuying = filterType === "refund" || filterType === "dispute";

  return (
    <AccountCanonicalShell
      title={title}
      backHref={fromBuying ? "/account/buying" : "/account"}
      backLabel={fromBuying ? "Buying" : "My Account"}
      showHeaderTitle
      showBottomNav={false}
      intro={intro}
    >
      <div className="flex w-full flex-col gap-ds-4 pb-ds-5">
        <CaseSection title="Buying" cases={buyer} emptyLabel="No cases yet." />
        <CaseSection title="Selling" cases={seller} emptyLabel="No cases yet." />
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
