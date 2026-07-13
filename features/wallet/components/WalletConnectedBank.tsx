"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BankLineIcon, ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import type { WithdrawMethod } from "@/lib/wallet/types";

type WalletConnectedBankProps = {
  bank: WithdrawMethod | null;
  verified: boolean;
};

export function WalletConnectedBank({ bank, verified }: WalletConnectedBankProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const removeBank = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/wallet/bank-account", { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Unable to remove bank account.");
        return;
      }
      router.refresh();
    });
  };

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
            <div className="wallet-v2__bank-actions" role="group" aria-label="Bank account actions">
              <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__bank-action">
                Change Bank
              </Link>
              <button
                type="button"
                className="wallet-v2__bank-action wallet-v2__bank-action--danger"
                disabled={isPending}
                onClick={removeBank}
              >
                {isPending ? "Removing…" : "Remove Bank"}
              </button>
            </div>
            {error ? (
              <p className="wallet-v2__bank-error" role="alert">
                {error}
              </p>
            ) : null}
          </>
        ) : (
          <div className="wallet-v2__bank-empty">
            <div className="wallet-v2__bank-empty-row">
              <span className="wallet-v2__bank-dash" aria-hidden>
                <BankLineIcon />
              </span>
              <div className="wallet-v2__bank-copy">
                <p className="wallet-v2__bank-name">No bank account connected</p>
                <p className="wallet-v2__bank-meta">Add your bank account to withdraw funds.</p>
              </div>
            </div>
            <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__cta">
              Connect Bank Account
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
