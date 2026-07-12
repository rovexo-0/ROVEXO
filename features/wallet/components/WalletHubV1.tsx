"use client";



import Link from "next/link";

import { AccountCanonicalShell } from "@/features/account-canonical";

import { cn } from "@/lib/cn";

import {

  resolveManualWithdrawableBalance,

  resolveReleasedToBankBalance,

  SELLER_WALLET_COPY,

  walletTransactionCategory,

} from "@/lib/transaction-hub/seller-wallet";

import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";

import type { WalletData, WalletTransaction } from "@/lib/wallet/types";



type WalletHubV1Props = {

  data: WalletData;

  backHref?: string;

  connectMessage?: string;

  showStatements?: boolean;

};



const RECENT_LIMIT = 8;



function TransactionRow({ transaction }: { transaction: WalletTransaction }) {

  const positive = transaction.amount >= 0;

  const amountClass = positive ? "wallet-hub__amount--in" : "wallet-hub__amount--out";

  const prefix = positive ? "+" : "−";

  const category = walletTransactionCategory(transaction);



  return (

    <Link href={`/wallet/transactions/${transaction.id}`} className="wallet-hub__txn">

      <div className="wallet-hub__txn-icon" aria-hidden>

        {transaction.type === "withdrawal" ? "↗" : "£"}

      </div>

      <div className="wallet-hub__txn-copy">

        <p className="wallet-hub__txn-title">

          {transaction.orderNumber ? `Order #${transaction.orderNumber}` : transaction.productTitle}

        </p>

        <p className="wallet-hub__txn-sub">

          {category} · {formatWalletDate(transaction.createdAt)}

        </p>

      </div>

      <p className={cn("wallet-hub__txn-amount", amountClass)}>

        {prefix} {formatCurrency(Math.abs(transaction.amount))}

      </p>

    </Link>

  );

}



export function WalletHubV1({

  data,

  backHref = "/account",

  connectMessage,

  showStatements = false,

}: WalletHubV1Props) {

  const visible = data.transactions.slice(0, RECENT_LIMIT);

  const withdrawable = resolveManualWithdrawableBalance(data);

  const releasedToBank = resolveReleasedToBankBalance(data);

  const { withdrawalSummary } = data;



  return (

    <AccountCanonicalShell title="Wallet" backHref={backHref} backLabel="My Account">

      <div className="wallet-hub" data-wallet-hub-version="v1.0-production">

        {connectMessage ? <p className="wallet-hub__notice">{connectMessage}</p> : null}



        <section className="wallet-hub__balance-card" aria-labelledby="wallet-available-label">

          <p id="wallet-available-label" className="wallet-hub__label">

            {SELLER_WALLET_COPY.availableBalance}

          </p>

          <p className="wallet-hub__balance">{formatCurrency(withdrawable)}</p>

          <p className="wallet-hub__hint">{SELLER_WALLET_COPY.keepInWallet}</p>



          <div className="wallet-hub__earnings-grid">

            <div>

              <p className="wallet-hub__label">{SELLER_WALLET_COPY.pendingBalance}</p>

              <p className="wallet-hub__mini-balance">{formatCurrency(data.pendingBalance)}</p>

              <p className="wallet-hub__hint">{SELLER_WALLET_COPY.pendingReason}</p>

            </div>

            <div>

              <p className="wallet-hub__label">Released to Bank</p>

              <p className="wallet-hub__mini-balance">{formatCurrency(releasedToBank)}</p>

            </div>

            <div>

              <p className="wallet-hub__label">{SELLER_WALLET_COPY.processingWithdrawals}</p>

              <p className="wallet-hub__mini-balance">

                {formatCurrency(withdrawalSummary.processingTotal)}

              </p>

              {withdrawalSummary.processingCount > 0 ? (

                <p className="wallet-hub__hint">{withdrawalSummary.processingCount} in progress</p>

              ) : null}

            </div>

            <div>

              <p className="wallet-hub__label">{SELLER_WALLET_COPY.completedWithdrawals}</p>

              <p className="wallet-hub__mini-balance">

                {formatCurrency(withdrawalSummary.completedTotal)}

              </p>

            </div>

          </div>



          <p className="wallet-hub__fee-note">{SELLER_WALLET_COPY.platformFeeBuyerOnly}</p>



          <Link

            href="/wallet/withdraw"

            className={cn(

              "wallet-hub__withdraw wallet-hub__withdraw--primary",

              withdrawable <= 0 && "wallet-hub__withdraw--disabled",

            )}

            aria-disabled={withdrawable <= 0}

            onClick={(event) => {

              if (withdrawable <= 0) event.preventDefault();

            }}

          >

            {SELLER_WALLET_COPY.withdrawFunds}

          </Link>

        </section>



        <section className="ac-canonical__section" aria-labelledby="wallet-txn-title">

          <div className="wallet-hub__section-head">

            <h2 id="wallet-txn-title" className="ac-canonical__section-title">
              Transactions
            </h2>

            {data.transactions.length > RECENT_LIMIT ? (

              <Link href="/wallet/transactions" className="wallet-hub__section-link">

                View all

              </Link>

            ) : null}

          </div>



          <div className="wallet-hub__txn-card">

            {visible.length === 0 ? (

              <p className="wallet-hub__empty">No transactions yet.</p>

            ) : (

              visible.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)

            )}

          </div>

        </section>



        {showStatements ? (

          <section className="ac-canonical__section" aria-labelledby="wallet-statements-title">

            <div className="wallet-hub__section-head">

              <h2 id="wallet-statements-title" className="ac-canonical__section-title">

                Statements

              </h2>

              <Link href="/wallet/statements" className="wallet-hub__section-link">

                Monthly

              </Link>

            </div>

            <div className="wallet-hub__txn-card px-ds-4 py-ds-4">

              <p className="text-sm text-text-secondary">

                Monthly and annual seller statements with sales, fees, refunds, withdrawals, and PDF export.

              </p>

              <Link href="/wallet/statements/annual" className="mt-ds-3 inline-flex text-sm font-medium text-primary">

                Annual Statements

              </Link>

            </div>

          </section>

        ) : null}

      </div>

    </AccountCanonicalShell>

  );

}


