"use client";

import Link from "next/link";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";
import { formatCurrency } from "@/lib/wallet/utils";

export function SellerBalanceCard() {
  const { data } = useSellerDashboard();
  const { wallet } = data;

  return (
    <SellerSection id="seller-balance" title="Payments" href="/wallet">
      <div className="seller-card">
        <div className="seller-metric-grid">
          <div className="seller-metric">
            <p className="seller-metric__value">{formatCurrency(wallet.availableBalance)}</p>
            <p className="seller-metric__label">Current balance</p>
          </div>
          <div className="seller-metric">
            <p className="seller-metric__value">{formatCurrency(wallet.pendingBalance)}</p>
            <p className="seller-metric__label">Pending balance</p>
          </div>
        </div>
      </div>
      {wallet.transactions.slice(0, 3).map((transaction) => (
        <Link key={transaction.id} href={`/wallet/transactions/${transaction.id}`} className="seller-list-row">
          <div className="min-w-0">
            <p className="seller-list-row__title">{transaction.productTitle}</p>
            <p className="seller-list-row__meta">{formatCurrency(transaction.amount)} · {transaction.status}</p>
          </div>
        </Link>
      ))}
    </SellerSection>
  );
}
