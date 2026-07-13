"use client";

import Link from "next/link";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

type WalletInsightsProps = {
  sales: number;
  withdrawn: number;
  pending: number;
  pendingAvailableAt: string;
};

export function WalletInsights({ sales, withdrawn, pending, pendingAvailableAt }: WalletInsightsProps) {
  const status = pending > 0 ? "Pending release" : "No payout scheduled";

  return (
    <section className="wallet-v2__insights" aria-label="Wallet insights">
      <article className="wallet-v2__insight-card">
        <h2 className="wallet-v2__section-title">This Month</h2>
        <dl className="wallet-v2__insight-list">
          <div>
            <dt>Sales</dt>
            <dd>{formatCurrency(sales)}</dd>
          </div>
          <div>
            <dt>Withdrawn</dt>
            <dd>{formatCurrency(withdrawn)}</dd>
          </div>
          <div>
            <dt>Pending</dt>
            <dd>{formatCurrency(pending)}</dd>
          </div>
        </dl>
      </article>

      <article className="wallet-v2__insight-card">
        <div className="wallet-v2__section-head">
          <h2 className="wallet-v2__section-title">Next Payout</h2>
          <Link href={WALLET_ROUTES.payouts} className="wallet-v2__section-link">
            Details
          </Link>
        </div>
        <p className="wallet-v2__insight-kicker">Expected amount</p>
        <p className="wallet-v2__insight-amount">{formatCurrency(pending)}</p>
        <p className="wallet-v2__insight-copy">
          {pendingAvailableAt
            ? `Estimated date · ${formatWalletDate(pendingAvailableAt)}`
            : "Estimated date · After delivery hold"}
        </p>
        <p className="wallet-v2__insight-status">
          Status · <strong>{status}</strong>
        </p>
      </article>
    </section>
  );
}
