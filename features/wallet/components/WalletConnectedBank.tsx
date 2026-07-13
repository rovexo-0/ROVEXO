"use client";

import Link from "next/link";
import { BankLineIcon, EditLineIcon, ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import type { WithdrawMethod } from "@/lib/wallet/types";

type WalletConnectedBankProps = {
  bank: WithdrawMethod | null;
  verified: boolean;
};

export function WalletConnectedBank({ bank, verified }: WalletConnectedBankProps) {
  return (
    <section className="wallet-v2__section" aria-labelledby="wallet-bank-title">
      <div className="wallet-v2__section-head">
        <h2 id="wallet-bank-title" className="wallet-v2__section-title">
          Connected Bank
        </h2>
      </div>

      <div className="wallet-v2__bank-card">
        {bank ? (
          <>
            <div className="wallet-v2__bank-row">
              <span className="wallet-v2__bank-logo" aria-hidden>
                <BankLineIcon />
              </span>
              <div className="wallet-v2__bank-copy">
                <div className="wallet-v2__bank-name-row">
                  <p className="wallet-v2__bank-name">{bank.label}</p>
                  {verified ? (
                    <span className="wallet-v2__bank-verified">
                      <ShieldLineIcon />
                      Verified
                    </span>
                  ) : null}
                </div>
                <p className="wallet-v2__bank-meta">****{bank.lastDigits}</p>
              </div>
            </div>
            <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__bank-change">
              <EditLineIcon />
              Change Bank
            </Link>
          </>
        ) : (
          <div className="wallet-v2__bank-empty">
            <span className="wallet-v2__bank-logo wallet-v2__bank-logo--muted" aria-hidden>
              <BankLineIcon />
            </span>
            <p className="wallet-v2__empty">No bank account connected</p>
            <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__cta">
              Connect Bank Account
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
