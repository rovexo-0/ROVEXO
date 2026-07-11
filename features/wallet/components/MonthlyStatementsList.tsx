"use client";

import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { PageBack } from "@/components/navigation/PageBack";
import { formatCurrency } from "@/lib/wallet/utils";
import type { MonthlyStatement } from "@/lib/wallet/monthly-statements";

type MonthlyStatementsListProps = {
  statements: MonthlyStatement[];
};

export function MonthlyStatementsList({ statements }: MonthlyStatementsListProps) {
  return (
    <BetaAppShell bottomNavTab="account">
      <header className="wallet-hub__header">
        <PageBack backHref="/wallet" backLabel="Wallet" preferHistory className="wallet-hub__back" />
        <h1 className="wallet-hub__title">Monthly Statements</h1>
        <span className="wallet-hub__header-spacer" aria-hidden />
      </header>

      <ScrollContainer withBottomNav className="wallet-hub" data-wallet-statements-version="v1.0-legal-lock">
        <div className="wallet-hub__section-head px-ds-4">
          <Link href="/wallet/statements/annual" className="wallet-hub__section-link">
            Annual Statements
          </Link>
        </div>
        {statements.length === 0 ? (
          <p className="wallet-hub__empty px-ds-4">Statements appear after your first seller activity.</p>
        ) : (
          <div className="wallet-hub__txn-card">
            {statements.map((statement) => (
              <Link
                key={statement.period}
                href={`/wallet/statements/${statement.period}`}
                className="wallet-hub__txn"
              >
                <div className="wallet-hub__txn-copy">
                  <p className="wallet-hub__txn-title">{statement.label}</p>
                  <p className="wallet-hub__txn-sub">
                    End balance {formatCurrency(statement.endBalance)}
                  </p>
                </div>
                <span className="wallet-hub__section-link">Open</span>
              </Link>
            ))}
          </div>
        )}
      </ScrollContainer>
    </BetaAppShell>
  );
}
