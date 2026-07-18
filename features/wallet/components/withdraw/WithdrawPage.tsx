"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { useToast } from "@/components/ui/Toast";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { formatCurrency, parseWithdrawAmount } from "@/lib/wallet/utils";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
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
    <AccountCanonicalShell title="Withdraw" backHref="/wallet" backLabel="Wallet" showHeaderTitle>
      <div className="ac-canonical" data-wallet-withdraw-version="v3.0-one-product">
        <CanonicalSection title="Balance">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Available"
              value={formatCurrency(data.availableBalance)}
              showChevron={false}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="wallet" />
                </span>
              }
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Bank">
          <CanonicalCard variant="list">
            {connectedMethod ? (
              <CanonicalMenuRow
                title={connectedMethod.label}
                description={`•••• ${connectedMethod.lastDigits}`}
                href={WALLET_ROUTES.bankAccount}
                icon={
                  <span className="ac-canonical__menu-icon" aria-hidden>
                    <AccountIcon name="payment" />
                  </span>
                }
              />
            ) : (
              <CanonicalMenuRow
                title="Add bank account"
                description="Required before withdrawing"
                href={WALLET_ROUTES.bankAccount}
                icon={
                  <span className="ac-canonical__menu-icon" aria-hidden>
                    <AccountIcon name="payment" />
                  </span>
                }
              />
            )}
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Amount">
          <CanonicalCard variant="medium" className="flex flex-col gap-ds-3 p-ds-4">
            <label htmlFor="withdraw-amount" className="text-sm font-medium text-text-primary">
              Amount
            </label>
            <input
              id="withdraw-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="min-h-11 w-full rounded-[20px] border border-[rgb(15_23_42/0.08)] px-ds-4 text-base"
            />
            <button
              type="button"
              className="min-h-11 text-left text-sm font-semibold text-primary"
              onClick={() => setAmount(data.availableBalance.toFixed(2))}
            >
              Withdraw All
            </button>
            <p className="text-sm text-text-secondary">
              You will receive{" "}
              <strong className="text-text-primary">
                {formatCurrency(parsedAmount > 0 ? parsedAmount : 0)}
              </strong>
            </p>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <CanonicalButton
              variant="primary"
              fullWidth
              disabled={isSubmitting || !connectedMethod || parsedAmount <= 0}
              onClick={() => void handleWithdraw()}
            >
              {isSubmitting ? "Processing…" : "Withdraw to Bank Account"}
            </CanonicalButton>
            {!connectedMethod ? (
              <p className="text-sm text-text-secondary">
                <Link href={`${WALLET_ROUTES.bankAccount}?returnTo=/wallet/withdraw`} className="font-semibold text-primary">
                  Manage bank account in Wallet
                </Link>{" "}
                before withdrawing.
              </p>
            ) : null}
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
