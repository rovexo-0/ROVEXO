"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BankLineIcon } from "@/components/icons/RvxLineIcons";
import {
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
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
    <CanonicalSection title="Bank">
      <CanonicalCard variant="list">
        {bank ? (
          <>
            <CanonicalMenuRow
              title={bank.label}
              description={`•••• ${bank.lastDigits}`}
              icon={<BankLineIcon />}
              value={verified ? "Verified" : undefined}
              href={WALLET_ROUTES.bankAccount}
            />
            <CanonicalMenuRow title="Edit bank" href={WALLET_ROUTES.bankAccount} />
            <CanonicalMenuRow title="Change bank" href={WALLET_ROUTES.bankAccount} />
            <CanonicalMenuRow
              title={isPending ? "Removing…" : "Remove bank"}
              destructive
              hideChevron
              disabled={isPending}
              onClick={removeBank}
            />
          </>
        ) : (
          <CanonicalMenuRow
            title="Connect bank account"
            description="Required for withdrawals"
            icon={<BankLineIcon />}
            href={WALLET_ROUTES.bankAccount}
          />
        )}
      </CanonicalCard>

      {error ? (
        <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock>
      ) : null}
    </CanonicalSection>
  );
}
