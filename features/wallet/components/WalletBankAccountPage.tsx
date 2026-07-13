"use client";

import { useEffect, useState } from "react";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import {
  CanonicalButton,
  CanonicalButtonLink,
  CanonicalCard,
  CanonicalSection,
} from "@/src/components/canonical";
import { WALLET_ROUTES, walletRouteWithReturn } from "@/lib/wallet/canonical-routes";

type WalletBankAccountPageProps = {
  connected: boolean;
  returnTo: string | null;
};

export function WalletBankAccountPage({ connected: initialConnected, returnTo }: WalletBankAccountPageProps) {
  const backHref = returnTo
    ? walletRouteWithReturn(WALLET_ROUTES.paymentMethods, returnTo)
    : WALLET_ROUTES.paymentMethods;

  return (
    <AccountCanonicalShell title="Bank Account" backHref={backHref} backLabel="Payment Methods">
      <AccountPageStack aria-label="Bank account">
        <WalletBankAccountPanel connected={initialConnected} returnTo={returnTo} />
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}

function WalletBankAccountPanel({
  connected: initialConnected,
  returnTo,
}: {
  connected: boolean;
  returnTo: string | null;
}) {
  const [connected, setConnected] = useState(initialConnected);
  const [open, setOpen] = useState(false);

  return (
    <>
      <CanonicalSection title="Connected Bank">
        <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
          {connected ? (
            <p className="account-settings-empty">Bank account connected and verified for payouts.</p>
          ) : (
            <p className="account-settings-empty">No bank account added yet.</p>
          )}
          <CanonicalButton type="button" fullWidth onClick={() => setOpen(true)}>
            {connected ? "Change Bank" : "Add Bank Account"}
          </CanonicalButton>
        </CanonicalCard>
      </CanonicalSection>

      {returnTo ? (
        <CanonicalButtonLink href={returnTo} variant="ghost" className="mt-ds-2">
          Continue where you left off
        </CanonicalButtonLink>
      ) : null}

      <BankAccountModalLazy
        open={open}
        connected={connected}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setConnected(true);
          setOpen(false);
        }}
        onRemoved={() => {
          setConnected(false);
          setOpen(false);
        }}
        returnTo={returnTo}
      />
    </>
  );
}

function BankAccountModalLazy({
  open,
  connected,
  onClose,
  onSaved,
  onRemoved,
  returnTo,
}: {
  open: boolean;
  connected: boolean;
  onClose: () => void;
  onSaved: () => void;
  onRemoved: () => void;
  returnTo: string | null;
}) {
  const [BankAccountForm, setBankAccountForm] = useState<
    typeof import("@/features/wallet/components/BankAccountForm").BankAccountForm | null
  >(null);

  useEffect(() => {
    if (!open || BankAccountForm) return;
    void import("@/features/wallet/components/BankAccountForm").then((mod) => {
      setBankAccountForm(() => mod.BankAccountForm);
    });
  }, [BankAccountForm, open]);

  if (!BankAccountForm) return null;

  return (
    <BankAccountForm
      open={open}
      connected={connected}
      onClose={onClose}
      onSaved={() => {
        onSaved();
        if (returnTo) {
          window.location.href = returnTo;
        }
      }}
      onRemoved={onRemoved}
    />
  );
}
