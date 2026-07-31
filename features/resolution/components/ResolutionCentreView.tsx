import { AccountCanonicalShell } from "@/features/account-canonical";
import { MasterMenuIcon } from "@/features/account-center/components/MasterMenuIcon";
import { MASTER_ICON_COLORS } from "@/lib/design-system/master-icon-system-v1";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
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
      <CanonicalCard variant="list">
        {cases.length === 0 ? (
          <CanonicalMenuRow title={emptyLabel} showChevron={false} />
        ) : (
          cases.map((caseRecord) => (
            <CanonicalMenuRow
              key={caseRecord.id}
              href={`/resolution/${caseRecord.id}`}
              title={caseRecord.caseType.replace("_", " ")}
              description={`${caseRecord.reason} · ${caseRecord.status}`}
              icon={<MasterMenuIcon icon="returns" color={MASTER_ICON_COLORS.orange} />}
            />
          ))
        )}
      </CanonicalCard>
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
      <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5">
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
