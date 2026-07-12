"use client";

import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/wallet/utils";
import type { AnnualStatement } from "@/lib/wallet/monthly-statements";

type AnnualStatementDetailProps = {
  statement: AnnualStatement;
};

function SummaryRow({ label, value, negative = false }: { label: string; value: number; negative?: boolean }) {
  if (value === 0) return null;
  return (
    <div className="wallet-statement__summary-row">
      <span>{label}</span>
      <span className={negative ? "wallet-hub__amount--out" : "wallet-hub__amount--in"}>
        {negative ? "−" : "+"} {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

export function AnnualStatementDetail({ statement }: AnnualStatementDetailProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <BetaAppShell bottomNavTab="account">
      <CanonicalPageHeader
        title={`${statement.label} Statement`}
        backHref="/wallet/statements/annual"
        backLabel="Annual"
        className="print:hidden"
      />

      <ScrollContainer
        withBottomNav
        className="wallet-hub wallet-statement"
        data-wallet-annual-statement-version="v1.0-legal-lock"
      >
        <section className="wallet-hub__balance-card">
          <div className="wallet-statement__summary-row">
            <span>Start Balance</span>
            <strong>{formatCurrency(statement.startBalance)}</strong>
          </div>
          <SummaryRow label="Sales" value={statement.sales} />
          <SummaryRow label="Platform Fees" value={statement.platformFees} negative />
          <SummaryRow label="Refunds" value={statement.refunds} negative />
          <SummaryRow label="Withdrawals" value={statement.withdrawals} negative />
          <div className="wallet-statement__summary-row wallet-statement__summary-row--total">
            <span>End Balance</span>
            <strong>{formatCurrency(statement.endBalance)}</strong>
          </div>
        </section>

        <section aria-labelledby="annual-months-title">
          <div className="wallet-hub__section-head">
            <h2 id="annual-months-title" className="wallet-hub__section-title">
              Monthly Breakdown
            </h2>
            <button type="button" className="wallet-hub__section-link" onClick={handlePrint}>
              Download PDF
            </button>
          </div>

          <div className="wallet-hub__txn-card">
            {statement.months.map((month) => (
              <div key={month.period} className="wallet-hub__txn">
                <div className="wallet-hub__txn-copy">
                  <p className="wallet-hub__txn-title">{month.label}</p>
                  <p className="wallet-hub__txn-sub">End balance {formatCurrency(month.endBalance)}</p>
                </div>
                <p className={cn("wallet-hub__txn-amount", "wallet-hub__amount--in")}>
                  + {formatCurrency(month.sales)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </ScrollContainer>
    </BetaAppShell>
  );
}
