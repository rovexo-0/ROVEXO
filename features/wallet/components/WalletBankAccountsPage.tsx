"use client";

import { useEffect, useState } from "react";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import {
  WalletBankAccountsIcon,
  WalletBusinessAccountIcon,
  WalletHelpHeaderAction,
  WalletPersonalAccountIcon,
  WalletSecurityIcon,
} from "@/features/wallet/components/WalletProfileChrome";
import { CanonicalCard, CanonicalInfoBlock, CanonicalMenuRow } from "@/src/components/canonical";
import { FAIL_CLOSED_USER_MESSAGE } from "@/lib/fail-closed/constants";
import { resolveBusinessVisibility } from "@/lib/master-engine";
import { WALLET_ROUTES, walletRouteWithReturn } from "@/lib/wallet/canonical-routes";
import type { ConnectPayoutStatus } from "@/lib/wallet/types";
import "@/styles/rovexo/bank-accounts-v5.css";

export const BANK_ACCOUNTS_UI_VERSION = "v5.1" as const;
export const BANK_ACCOUNTS_UI_DOM = "v5.1-profile-inheritance" as const;

type WalletBankAccountsPageProps = {
  personalConnected: boolean;
  connectStatus: ConnectPayoutStatus;
  isBusinessVerified: boolean;
  returnTo: string | null;
};

/**
 * Bank Accounts — Profile / Settings Master Design System inheritance.
 * Personal = UK bank API. Business = Stripe Connect.
 * Fail-closed: empty / unavailable — never technical errors.
 */
export function WalletBankAccountsPage({
  personalConnected: initialPersonalConnected,
  connectStatus,
  isBusinessVerified,
  returnTo,
}: WalletBankAccountsPageProps) {
  const backHref = returnTo
    ? walletRouteWithReturn(WALLET_ROUTES.hub, returnTo)
    : WALLET_ROUTES.hub;
  const showBusiness = resolveBusinessVisibility({ isBusinessVerified }).showBusinessBank;
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  return (
    <AccountCanonicalShell
      title="Bank Accounts"
      backHref={backHref}
      backLabel="Balance"
      showHeaderTitle
      rightAction={<WalletHelpHeaderAction />}
      dataMyAccountSurface="bank-accounts"
    >
      <div
        className="ba-profile fw-engine__stack"
        data-bank-accounts-ui={BANK_ACCOUNTS_UI_VERSION}
        data-bank-accounts-lock={BANK_ACCOUNTS_UI_DOM}
        data-profile-master="v7.0"
        data-design-master="profile"
        data-full-width-surface="bank-accounts"
        data-icon-system="profile-v1.0"
      >
        <AccountPageStack aria-label="Bank accounts">
          <h2 className="cds-section__title">Your Accounts</h2>
          <CanonicalCard variant="list" className="ba-profile__list">
            <PersonalAccountRow
              initialConnected={initialPersonalConnected}
              returnTo={returnTo}
            />
            {showBusiness ? (
              <BusinessAccountRow
                connectStatus={connectStatus}
                onFail={() => setConnectMessage(FAIL_CLOSED_USER_MESSAGE)}
              />
            ) : null}
          </CanonicalCard>

          <CanonicalInfoBlock>
            How payouts work: buyer receives the order → protection period ends → funds become
            available → withdraw to your bank account.
          </CanonicalInfoBlock>

          <CanonicalCard variant="list" className="ba-profile__list">
            <CanonicalMenuRow
              href="/help"
              title="Payment security"
              description="Payouts are encrypted and processed securely."
              icon={<WalletSecurityIcon />}
            />
            <CanonicalMenuRow
              href={WALLET_ROUTES.hub}
              title="Back to Balance"
              description="View available, pending, and locked funds."
              icon={<WalletBankAccountsIcon />}
            />
          </CanonicalCard>

          {connectMessage ? (
            <CanonicalInfoBlock variant="error">{connectMessage}</CanonicalInfoBlock>
          ) : null}

          {returnTo ? (
            <CanonicalMenuRow href={returnTo} title="Back to Balance" />
          ) : null}
        </AccountPageStack>
      </div>
    </AccountCanonicalShell>
  );
}

function PersonalAccountRow({
  initialConnected,
  returnTo,
}: {
  initialConnected: boolean;
  returnTo: string | null;
}) {
  const [connected, setConnected] = useState(initialConnected);
  const [open, setOpen] = useState(false);

  return (
    <>
      <CanonicalMenuRow
        title="Personal Account"
        description="Receive money from your sales"
        value={connected ? "Verified" : "Not added"}
        icon={<WalletPersonalAccountIcon />}
        onClick={() => setOpen(true)}
      />
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

function BusinessAccountRow({
  connectStatus,
  onFail,
}: {
  connectStatus: ConnectPayoutStatus;
  onFail: () => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const ready = connectStatus.connected && connectStatus.payoutsEnabled;
  const pending = connectStatus.connected && !connectStatus.payoutsEnabled;
  const status = ready ? "Verified" : pending ? "Pending" : "Not added";

  async function startConnect() {
    if (ready || connecting) return;
    setConnecting(true);
    try {
      const response = await fetch("/api/wallet/connect", { method: "POST" });
      const payload = (await response.json()) as { success?: boolean; url?: string };
      if (payload.success && payload.url) {
        window.location.href = payload.url;
        return;
      }
      onFail();
    } catch {
      onFail();
    } finally {
      setConnecting(false);
    }
  }

  return (
    <CanonicalMenuRow
      title="Business Account"
      description={connecting ? "Opening secure connection…" : "Receive business payouts"}
      value={status}
      icon={<WalletBusinessAccountIcon />}
      onClick={() => void startConnect()}
      disabled={connecting || ready}
    />
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
  const [importFailed, setImportFailed] = useState(false);

  useEffect(() => {
    if (!open || BankAccountForm) return;
    void import("@/features/wallet/components/BankAccountForm")
      .then((mod) => {
        setBankAccountForm(() => mod.BankAccountForm);
      })
      .catch(() => {
        setImportFailed(true);
      });
  }, [BankAccountForm, open]);

  if (!open) return null;
  if (importFailed) {
    return (
      <CanonicalInfoBlock variant="error">{FAIL_CLOSED_USER_MESSAGE}</CanonicalInfoBlock>
    );
  }
  if (!BankAccountForm) {
    return null;
  }

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
