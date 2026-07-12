"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { formatCurrency, parseWithdrawAmount } from "@/lib/wallet/utils";
import type { WalletData } from "@/lib/wallet/types";
type WithdrawPageProps = {
  data: WalletData;
};

export function WithdrawPage({ data }: WithdrawPageProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectedMethod = useMemo(
    () => data.withdrawMethods.find((method) => method.connected) ?? null,
    [data.withdrawMethods],
  );

  const parsedAmount = useMemo(
    () => parseWithdrawAmount(amount, data.availableBalance),
    [amount, data.availableBalance],
  );

  const handleWithdraw = async () => {
    if (!connectedMethod || parsedAmount <= 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          methodId: connectedMethod.id,
          amount: parsedAmount,
        }),
      });

      if (!response.ok) {
        setError("Unable to submit withdrawal. Please try again.");
        return;
      }

      pushToast({
        title: "Withdrawal request submitted.",
        variant: "success",
      });
      router.push("/wallet");
      router.refresh();
    } catch {
      setError("Unable to submit withdrawal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BetaAppShell bottomNavTab="account">
      <CanonicalPageHeader title="Withdraw" backHref="/wallet" backLabel="Wallet" />

      <ScrollContainer withBottomNav className="wallet-hub wallet-hub--withdraw" data-wallet-withdraw-version="v2.0-02b">
        <section className="wallet-hub__balance-card">
          <p className="wallet-hub__label">Available Balance</p>
          <p className="wallet-hub__balance">{formatCurrency(data.availableBalance)}</p>
        </section>

        <section className="wallet-hub__bank-card" aria-labelledby="withdraw-bank-title">
          <div className="wallet-hub__section-head">
            <h2 id="withdraw-bank-title" className="wallet-hub__section-title">
              Connected Bank
            </h2>
            <Link href="/account/settings/bank-account" className="wallet-hub__section-link">
              {connectedMethod ? "Edit Bank" : "Add Bank"}
            </Link>
          </div>
          <div className="wallet-hub__txn-card">
            {connectedMethod ? (
              <div className="wallet-hub__bank-row">
                <p className="wallet-hub__bank-label">{connectedMethod.label}</p>
                <p className="wallet-hub__bank-digits">•••• {connectedMethod.lastDigits}</p>
              </div>
            ) : (
              <p className="wallet-hub__empty">Connect a bank account to withdraw funds.</p>
            )}
          </div>
        </section>

        <section className="wallet-hub__withdraw-form" aria-labelledby="withdraw-amount-label">
          <label htmlFor="withdraw-amount" id="withdraw-amount-label" className="wallet-hub__label">
            Amount
          </label>
          <input
            id="withdraw-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="wallet-hub__amount-input"
          />

          <button
            type="button"
            className="wallet-hub__withdraw-all"
            onClick={() => setAmount(data.availableBalance.toFixed(2))}
          >
            Withdraw All
          </button>

          <p className="wallet-hub__receive">
            You will receive <strong>{formatCurrency(parsedAmount > 0 ? parsedAmount : 0)}</strong>
          </p>

          {error ? (
            <p className="wallet-hub__form-error" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </ScrollContainer>

      <footer className="wallet-hub__withdraw-footer">
        <button
          type="button"
          className={cn("wallet-hub__submit", isSubmitting && "wallet-hub__submit--busy")}
          disabled={isSubmitting || !connectedMethod || parsedAmount <= 0}
          onClick={() => void handleWithdraw()}
        >
          {isSubmitting ? "Processing…" : "Withdraw to Bank Account"}
        </button>
        {!connectedMethod ? (
          <p className="wallet-hub__footer-note">
            <Link href="/account/settings/bank-account?returnTo=/wallet/withdraw">
              Add your bank account in Settings
            </Link>{" "}
            before withdrawing.
          </p>
        ) : null}
      </footer>
    </BetaAppShell>
  );
}
