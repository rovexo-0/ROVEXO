"use client";

import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import {
  buildHmrcExportRows,
  serializeComplianceCsv,
} from "@/lib/compliance/digital-platform-reporting";
import { summarizeUkComplianceAudit, UK_COMPLIANCE_AUDIT } from "@/lib/compliance/uk-audit";
import type { AnnualStatement } from "@/lib/wallet/monthly-statements";
import type { SellerTaxProfile } from "@/lib/seller/tax/types";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { useMemo } from "react";

type ComplianceDashboardProps = {
  taxProfile: SellerTaxProfile | null;
  annualStatements: AnnualStatement[];
};

export function ComplianceDashboard({ taxProfile, annualStatements }: ComplianceDashboardProps) {
  const summary = useMemo(() => summarizeUkComplianceAudit(), []);
  const exportRows = useMemo(() => buildHmrcExportRows(annualStatements), [annualStatements]);

  const downloadCsv = () => {
    const blob = new Blob([serializeComplianceCsv(exportRows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rovexo-compliance-export.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AccountCanonicalShell
      title="Compliance"
      backHref="/account/settings"
      backLabel="Settings"
      showHeaderTitle
      intro="Tax profile, reporting exports, and UK marketplace compliance status."
    >
      <div className="ac-canonical flex w-full flex-col pb-ds-5" data-compliance-version="v1.0-legal-lock">
        <CanonicalSection title="Tax">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Seller Tax Profile"
              description={
                taxProfile
                  ? `Registered as ${taxProfile.registrationType}. UTR on file: ${taxProfile.utr ? "Yes" : "No"}.`
                  : "Complete your tax profile for withdrawals and reporting."
              }
              href="/seller/tax"
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="business" />
                </span>
              }
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Documents">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Monthly Statements" href="/wallet/statements" />
            <CanonicalMenuRow title="Annual Statements" href="/wallet/statements/annual" />
            <CanonicalMenuRow
              title="Digital Platform Reporting Notice"
              href="/legal/digital-platform-reporting-tax-notice"
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Export">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="HMRC CSV"
              description={
                exportRows.length === 0
                  ? "No annual totals yet"
                  : `${exportRows.length} row${exportRows.length === 1 ? "" : "s"} ready`
              }
              showChevron={false}
              disabled={exportRows.length === 0}
              onClick={downloadCsv}
              value={exportRows.length === 0 ? undefined : "Export"}
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="UK Compliance Audit">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Summary"
              description={`${summary.implemented} implemented · ${summary.partial} partial · ${summary.missing} missing`}
              showChevron={false}
            />
            {UK_COMPLIANCE_AUDIT.map((finding) => (
              <CanonicalMenuRow
                key={finding.area}
                title={finding.area.replaceAll("_", " ")}
                value={finding.status}
                showChevron={false}
              />
            ))}
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
