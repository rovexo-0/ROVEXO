"use client";

import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { cn } from "@/lib/cn";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { MonthlyStatement } from "@/lib/wallet/monthly-statements";
import { serializeMonthlyStatementCsv } from "@/lib/wallet/statement-export";

type MonthlyStatementDetailProps = {
  statement: MonthlyStatement;
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

export function MonthlyStatementDetail({ statement }: MonthlyStatementDetailProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleCsv = () => {
    const blob = new Blob([serializeMonthlyStatementCsv(statement)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rovexo-statement-${statement.period}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BetaAppShell bottomNavTab="account">
      <CanonicalPageHeader
        title={statement.label}
        backHref="/wallet/statements"
        backLabel="Statements"
        className="print:hidden"
      />

      <ScrollContainer withBottomNav className="wallet-hub wallet-statement" data-wallet-statement-version="v2.0-02b">
        <section className="wallet-hub__balance-card">
          <div className="wallet-statement__summary-row">
            <span>Opening Balance</span>
            <strong>{formatCurrency(statement.startBalance)}</strong>
          </div>
          <SummaryRow label="Sales" value={statement.sales} />
          <SummaryRow label="Platform Fees" value={statement.platformFees} negative />
          <SummaryRow label="Refunds" value={statement.refunds} negative />
          <SummaryRow label="Withdrawals" value={statement.withdrawals} negative />
          <div className="wallet-statement__summary-row wallet-statement__summary-row--total">
            <span>Closing Balance</span>
            <strong>{formatCurrency(statement.endBalance)}</strong>
          </div>
        </section>

        <section aria-labelledby="statement-lines-title">
          <div className="wallet-hub__section-head">
            <h2 id="statement-lines-title" className="wallet-hub__section-title">
              Transaction History
            </h2>
            <div className="flex gap-ds-3">
              <button type="button" className="wallet-hub__section-link" onClick={handleCsv}>
                Download CSV
              </button>
              <button type="button" className="wallet-hub__section-link" onClick={handlePrint}>
                Download PDF
              </button>
            </div>
          </div>

          <div className="wallet-hub__txn-card">
            {statement.lines.length === 0 ? (
              <p className="wallet-hub__empty">No activity this month.</p>
            ) : (
              statement.lines.map((line) => {
                const positive = line.amount >= 0;
                return (
                  <div key={line.id} className="wallet-hub__txn">
                    <div className="wallet-hub__txn-copy">
                      <p className="wallet-hub__txn-title">{line.label}</p>
                      <p className="wallet-hub__txn-sub">
                        {line.orderNumber ? `#${line.orderNumber} · ` : ""}
                        {formatWalletDate(line.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("wallet-hub__txn-amount", positive ? "wallet-hub__amount--in" : "wallet-hub__amount--out")}>
                        {positive ? "+" : "−"} {formatCurrency(Math.abs(line.amount))}
                      </p>
                      <p className="text-xs text-text-muted">Bal {formatCurrency(line.runningBalance)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <p className="px-ds-4 text-xs text-text-muted print:hidden">
          Use Download PDF to save or print this statement. Statements remain available permanently.
        </p>
      </ScrollContainer>
    </BetaAppShell>
  );
}
