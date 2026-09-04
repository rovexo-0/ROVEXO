"use client";

import { memo } from "react";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

type WalletInsightsProps = {
  sales: number;
  withdrawn: number;
  pending: number;
  pendingAvailableAt: string;
  headingEmoji?: string | null;
};

/** Balance Insights — This Month + Next Payout. Visual polish only. */
export const WalletInsights = memo(function WalletInsights({
  sales,
  withdrawn,
  pending,
  pendingAvailableAt,
  headingEmoji = PLATFORM_EMOJI.date,
}: WalletInsightsProps) {
  const hasUpcoming = pending > 0 && Boolean(pendingAvailableAt);
  const glyph = headingEmoji ?? PLATFORM_EMOJI.date;

  return (
    <section className="wallet-v2__section wallet-v2__section--insights" aria-labelledby="wallet-insights-title">
      <h2 id="wallet-insights-title" className="sr-only">
        Insights
      </h2>

      <div className="wallet-v2__insights">
        <article className="wallet-v2__insight-card">
          <h3 className="wallet-v2__insight-heading">
            <span className="wallet-v2__insight-heading-icon" aria-hidden>
              {glyph}
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
              {glyph}
            </span>
            Next Payout
          </h3>
          {hasUpcoming ? (
            <>
              <p className="wallet-v2__insight-kicker">Estimated payout</p>
              <p className="wallet-v2__insight-amount">{formatCurrency(pending)}</p>
              <p className="wallet-v2__insight-status">
                Status: <strong>Pending release</strong>
              </p>
              <p className="wallet-v2__insight-copy">Expected: {formatWalletDate(pendingAvailableAt)}</p>
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
});
