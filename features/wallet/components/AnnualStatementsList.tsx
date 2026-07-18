"use client";

import Link from "next/link";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { formatCurrency } from "@/lib/wallet/utils";
import type { AnnualStatement } from "@/lib/wallet/monthly-statements";

type AnnualStatementsListProps = {
  statements: AnnualStatement[];
};

export function AnnualStatementsList({ statements }: AnnualStatementsListProps) {
  return (
    <AccountCanonicalShell
      title="Annual Statements"
      backHref="/wallet/statements"
      backLabel="Statements"
      showHeaderTitle
    >
      <div className="wallet-hub" data-wallet-annual-statements-version="v1.0-legal-lock">
        <div className="wallet-hub__txn-card">
          {statements.length === 0 ? (
            <p className="wallet-hub__empty">No annual statements yet.</p>
          ) : (
            statements.map((statement) => (
              <Link
                key={statement.year}
                href={`/wallet/statements/annual/${statement.year}`}
                className="wallet-hub__txn"
              >
                <div className="wallet-hub__txn-copy">
                  <p className="wallet-hub__txn-title">{statement.label}</p>
                  <p className="wallet-hub__txn-sub">
                    Sales {formatCurrency(statement.sales)} · End {formatCurrency(statement.endBalance)}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AccountCanonicalShell>
  );
}
