"use client";

import Link from "next/link";
import type { SVGProps } from "react";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

type WalletInsightsProps = {
  sales: number;
  withdrawn: number;
  pending: number;
  pendingAvailableAt: string;
};

type IconProps = SVGProps<SVGSVGElement>;

function CalendarLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3.5V7M16 3.5V7M3.5 10h17" strokeLinecap="round" />
    </svg>
  );
}

function PurseLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 10h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9Z" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" strokeLinecap="round" />
      <path d="M12 14v2" strokeLinecap="round" />
    </svg>
  );
}

export function WalletInsights({ sales, withdrawn, pending, pendingAvailableAt }: WalletInsightsProps) {
  const hasUpcoming = pending > 0 && Boolean(pendingAvailableAt);

  return (
    <section className="wallet-v2__section" aria-labelledby="wallet-insights-title">
      <div className="wallet-v2__section-head">
        <h2 id="wallet-insights-title" className="wallet-v2__section-title">
          Insights
        </h2>
        <Link href={WALLET_ROUTES.payouts} className="wallet-v2__section-link">
          View all
        </Link>
      </div>

      <div className="wallet-v2__insights">
        <article className="wallet-v2__insight-card">
          <h3 className="wallet-v2__insight-heading">
            <span className="wallet-v2__insight-heading-icon" aria-hidden>
              <CalendarLineIcon />
            </span>
            This Month
          </h3>
          <dl className="wallet-v2__insight-metrics">
            <div>
              <dt>Sales</dt>
              <dd className="is-sales">{formatCurrency(sales)}</dd>
            </div>
            <div>
              <dt>Withdrawn</dt>
              <dd className="is-withdrawn">{formatCurrency(withdrawn)}</dd>
            </div>
            <div>
              <dt>Pending</dt>
              <dd className="is-pending">{formatCurrency(pending)}</dd>
            </div>
          </dl>
        </article>

        <article className="wallet-v2__insight-card">
          <h3 className="wallet-v2__insight-heading">
            <span className="wallet-v2__insight-heading-icon" aria-hidden>
              <PurseLineIcon />
            </span>
            Next Payout
          </h3>
          {hasUpcoming ? (
            <>
              <p className="wallet-v2__insight-amount">{formatCurrency(pending)}</p>
              <p className="wallet-v2__insight-copy">
                Expected · {formatWalletDate(pendingAvailableAt)}
              </p>
            </>
          ) : (
            <>
              <p className="wallet-v2__insight-amount wallet-v2__insight-amount--empty" aria-hidden>
                —
              </p>
              <p className="wallet-v2__insight-copy">
                No upcoming payout when you have pending funds.
              </p>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
