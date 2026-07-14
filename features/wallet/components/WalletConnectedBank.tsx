"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BankLineIcon,
  ChevronRightLineIcon,
  EditLineIcon,
  ShieldLineIcon,
} from "@/components/icons/RvxLineIcons";
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
    <section className="wallet-v2__section wallet-v2__section--bank" aria-label="Connected bank">
      <div className="wallet-v2__bank-card">
        {bank ? (
          <>
            <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__bank-main">
              <span className="wallet-v2__bank-icon" aria-hidden>
                <BankLineIcon />
              </span>
              <span className="wallet-v2__bank-copy">
                <span className="wallet-v2__bank-name-row">
                  <span className="wallet-v2__bank-name">{bank.label}</span>
                  {verified ? (
                    <span className="wallet-v2__bank-verified">
                      <ShieldLineIcon />
                      Verified
                    </span>
                  ) : null}
                </span>
                <span className="wallet-v2__bank-meta">****{bank.lastDigits}</span>
              </span>
              <span className="wallet-v2__bank-chevron" aria-hidden>
                <ChevronRightLineIcon />
              </span>
            </Link>
            <div className="wallet-v2__bank-actions" role="group" aria-label="Bank account actions">
              <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__bank-action">
                <EditLineIcon />
                Edit Bank
              </Link>
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
          <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__bank-main wallet-v2__bank-main--empty">
            <span className="wallet-v2__bank-icon" aria-hidden>
              <BankLineIcon />
            </span>
            <span className="wallet-v2__bank-copy">
              <span className="wallet-v2__bank-name">No bank account connected</span>
              <span className="wallet-v2__bank-inline-cta">Connect Bank Account →</span>
            </span>
            <span className="wallet-v2__bank-chevron" aria-hidden>
              <ChevronRightLineIcon />
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
