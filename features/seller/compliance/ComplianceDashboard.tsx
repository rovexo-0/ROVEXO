"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { PageBack } from "@/components/navigation/PageBack";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  buildHmrcExportRows,
  serializeComplianceCsv,
} from "@/lib/compliance/digital-platform-reporting";
import { summarizeUkComplianceAudit, UK_COMPLIANCE_AUDIT } from "@/lib/compliance/uk-audit";
import type { AnnualStatement } from "@/lib/wallet/monthly-statements";
import type { SellerTaxProfile } from "@/lib/seller/tax/types";

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
    <BetaAppShell bottomNavTab="account">
      <HubPageMain withBottomNav className="mx-auto max-w-2xl px-ds-4 py-ds-6" data-compliance-version="v1.0-legal-lock">
        <PageBack backHref="/account/settings" backLabel="Settings" preferHistory />
        <header className="mt-ds-4">
          <h1 className="text-2xl font-bold text-text-primary">Compliance Dashboard</h1>
          <p className="mt-ds-2 text-sm text-text-secondary">
            Tax profile, reporting exports, and UK marketplace compliance status.
          </p>
        </header>

        <Card padding="md" className="mt-ds-6">
          <h2 className="text-base font-semibold text-text-primary">Seller Tax Profile</h2>
          <p className="mt-ds-2 text-sm text-text-secondary">
            {taxProfile
              ? `Registered as ${taxProfile.registrationType}. UTR on file: ${taxProfile.utr ? "Yes" : "No"}.`
              : "Complete your tax profile for withdrawals and digital platform reporting."}
          </p>
          <Link href="/seller/tax" className="mt-ds-4 inline-flex text-sm font-medium text-primary">
            {taxProfile ? "Edit Tax Profile" : "Add Tax Profile"}
          </Link>
        </Card>

        <Card padding="md" className="mt-ds-4">
          <h2 className="text-base font-semibold text-text-primary">Document Vault</h2>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            <li>
              <Link href="/wallet/statements" className="text-primary hover:opacity-80">
                Monthly Statements
              </Link>
            </li>
            <li>
              <Link href="/wallet/statements/annual" className="text-primary hover:opacity-80">
                Annual Statements
              </Link>
            </li>
            <li>
              <Link href="/legal/digital-platform-reporting-tax-notice" className="text-primary hover:opacity-80">
                Digital Platform Reporting Notice
              </Link>
            </li>
          </ul>
        </Card>

        <Card padding="md" className="mt-ds-4">
          <div className="flex items-center justify-between gap-ds-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Export Reports</h2>
              <p className="mt-ds-1 text-sm text-text-secondary">HMRC-ready annual totals CSV.</p>
            </div>
            <Button type="button" size="sm" onClick={downloadCsv} disabled={exportRows.length === 0}>
              Export CSV
            </Button>
          </div>
        </Card>

        <Card padding="md" className="mt-ds-4">
          <h2 className="text-base font-semibold text-text-primary">UK Compliance Audit</h2>
          <p className="mt-ds-2 text-sm text-text-secondary">
            {summary.implemented} implemented · {summary.partial} partial · {summary.missing} missing
          </p>
          <ul className="mt-ds-4 max-h-64 space-y-ds-2 overflow-y-auto text-sm">
            {UK_COMPLIANCE_AUDIT.map((finding) => (
              <li key={finding.area} className="flex items-start justify-between gap-ds-3 border-b border-border pb-ds-2">
                <span className="capitalize text-text-primary">{finding.area.replaceAll("_", " ")}</span>
                <span className="shrink-0 text-text-muted">{finding.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      </HubPageMain>
    </BetaAppShell>
  );
}
