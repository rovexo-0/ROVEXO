"use client";

import { useState } from "react";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import {
  WalletBankAccountsIcon,
  WalletBusinessAccountIcon,
  WalletPersonalAccountIcon,
  WalletSecurityIcon,
} from "@/features/wallet/components/WalletProfileChrome";
import { CanonicalCard, CanonicalInfoBlock, CanonicalMenuRow } from "@/src/components/canonical";
import { FAIL_CLOSED_USER_MESSAGE } from "@/lib/fail-closed/constants";
import { WALLET_ROUTES, walletRouteWithReturn } from "@/lib/wallet/canonical-routes";
import type { ConnectPayoutStatus } from "@/lib/wallet/types";
import "@/styles/rovexo/bank-accounts-v5.css";

export const BANK_ACCOUNTS_UI_VERSION = "v5.1" as const;
export const BANK_ACCOUNTS_UI_DOM = "v5.1-profile-inheritance" as const;

type WalletBankAccountsPageProps = {
  personalConnected: boolean;
  personalLastDigits?: string | null;
  connectStatus: ConnectPayoutStatus;
  isBusinessVerified: boolean;
  returnTo: string | null;
  sellerContext?: "individual" | "business";
  connectMessage?: string | null;
};

/**
 * Bank Accounts — Profile / Settings Master Design System inheritance.
 * Individual = Individual Stripe Connect (Stripe-hosted bank/payout collection).
 * Business = Business Stripe Connect.
 * ROVEXO must not collect bank details that belong in Stripe Connect onboarding.
 */
export function WalletBankAccountsPage({
  personalConnected: _personalConnected,
  personalLastDigits: _personalLastDigits = null,
  connectStatus,
  isBusinessVerified: _isBusinessVerified,
  returnTo,
  sellerContext = "individual",
  connectMessage: initialConnectMessage = null,
}: WalletBankAccountsPageProps) {
  void _personalConnected;
  void _personalLastDigits;
  void _isBusinessVerified;
  const backHref = returnTo
    ? walletRouteWithReturn(
        sellerContext === "business" ? WALLET_ROUTES.businessHub : WALLET_ROUTES.hub,
        returnTo === WALLET_ROUTES.businessHub || returnTo === WALLET_ROUTES.hub
          ? null
          : returnTo,
      )
    : sellerContext === "business"
      ? WALLET_ROUTES.businessHub
      : WALLET_ROUTES.hub;
  /** seller_context is authoritative — never mix Personal/Business rows. */
  const showBusiness = sellerContext === "business";
  const showPersonal = sellerContext === "individual";
  const [connectMessage, setConnectMessage] = useState<string | null>(initialConnectMessage);

  return (
    <AccountCanonicalShell
      title="Bank Accounts"
      backHref={backHref}
      backLabel="Balance"
      showHeaderTitle
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
            {showPersonal ? (
              <IndividualAccountRow
                connectStatus={connectStatus}
                onFail={(message) => setConnectMessage(message ?? FAIL_CLOSED_USER_MESSAGE)}
              />
            ) : null}
            {showBusiness ? (
              <BusinessAccountRow
                connectStatus={connectStatus}
                onFail={(message) => setConnectMessage(message ?? FAIL_CLOSED_USER_MESSAGE)}
              />
            ) : null}
          </CanonicalCard>

          <CanonicalInfoBlock>
            How payouts work: buyer receives the order → protection period ends → funds become
            available → withdraw to your bank account via Stripe.
          </CanonicalInfoBlock>

          <CanonicalCard variant="list" className="ba-profile__list">
            <CanonicalMenuRow
              href="/help"
              title="Payment security"
              description="Your bank details are securely managed by Stripe."
              icon={<WalletSecurityIcon />}
            />
            <CanonicalMenuRow
              href={sellerContext === "business" ? WALLET_ROUTES.businessHub : WALLET_ROUTES.hub}
              title="Back to Balance"
              description="View available, pending, and locked funds."
              icon={<WalletBankAccountsIcon />}
            />
          </CanonicalCard>

          {connectMessage ? (
            <CanonicalInfoBlock
              variant={
                connectMessage.toLowerCase().includes("saved") ||
                connectMessage.toLowerCase().includes("updated")
                  ? "success"
                  : "error"
              }
            >
              {connectMessage}
            </CanonicalInfoBlock>
          ) : null}

          {returnTo ? (
            <CanonicalMenuRow href={returnTo} title="Back to Balance" />
          ) : null}
        </AccountPageStack>
      </div>
    </AccountCanonicalShell>
  );
}

function mapConnectFailure(payload: {
  error?: string;
  code?: string;
  status?: number;
}): string {
  if (payload.status === 401 || payload.code === "unauthorized") {
    return "Please sign in again to manage your Stripe payout account.";
  }
  if (payload.status === 403) {
    return "You are not allowed to manage this payout account.";
  }
  const safe = payload.error?.trim();
  if (!safe || /^forbidden$/i.test(safe)) {
    return "Unable to open Stripe account management. Please try again.";
  }
  return safe;
}

async function openStripeConnectManagement(
  context: "individual" | "business",
  onFail: (message?: string) => void,
  setConnecting: (value: boolean) => void,
) {
  setConnecting(true);
  try {
    const response = await fetch("/api/wallet/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context, intent: "manage" }),
    });
    const payload = (await response.json()) as {
      success?: boolean;
      url?: string;
      error?: string;
      code?: string;
    };
    if (payload.success && payload.url) {
      window.location.href = payload.url;
      return;
    }
    onFail(mapConnectFailure({ ...payload, status: response.status }));
  } catch {
    onFail();
  } finally {
    setConnecting(false);
  }
}

function connectStatusLabel(connectStatus: ConnectPayoutStatus): string {
  if (connectStatus.connected && connectStatus.payoutsEnabled) return "Verified";
  if (connectStatus.connected && !connectStatus.payoutsEnabled) return "Restricted";
  return "Not connected";
}

function IndividualAccountRow({
  connectStatus,
  onFail,
}: {
  connectStatus: ConnectPayoutStatus;
  onFail: (message?: string) => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const status = connectStatusLabel(connectStatus);
  const restricted = connectStatus.connected && !connectStatus.payoutsEnabled;
  const manageTitle = restricted ? "Resolve on Stripe" : "Manage on Stripe";
  const changeTitle = "Change bank account";

  return (
    <>
      <CanonicalMenuRow
        title="Individual Account"
        description="Receive money from your sales via Stripe"
        value={status}
        icon={<WalletPersonalAccountIcon />}
        showChevron={false}
      />
      <CanonicalMenuRow
        title={connecting ? "Opening Stripe…" : manageTitle}
        description={
          restricted
            ? "Fix verification or payout requirements on Stripe."
            : "Open Stripe-hosted Connect for this Individual account."
        }
        onClick={() => {
          if (connecting) return;
          void openStripeConnectManagement("individual", onFail, setConnecting);
        }}
        disabled={connecting}
      />
      <CanonicalMenuRow
        title={connecting ? "Opening Stripe…" : changeTitle}
        description="Update payout bank details securely on Stripe."
        onClick={() => {
          if (connecting) return;
          void openStripeConnectManagement("individual", onFail, setConnecting);
        }}
        disabled={connecting}
      />
    </>
  );
}

function BusinessAccountRow({
  connectStatus,
  onFail,
}: {
  connectStatus: ConnectPayoutStatus;
  onFail: (message?: string) => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const status = connectStatusLabel(connectStatus);
  const restricted = connectStatus.connected && !connectStatus.payoutsEnabled;
  const manageTitle = restricted ? "Resolve on Stripe" : "Manage on Stripe";
  const changeTitle = "Change bank account";

  return (
    <>
      <CanonicalMenuRow
        title="Business Account"
        description="Receive business payouts via Stripe"
        value={status}
        icon={<WalletBusinessAccountIcon />}
        showChevron={false}
      />
      <CanonicalMenuRow
        title={connecting ? "Opening Stripe…" : manageTitle}
        description={
          restricted
            ? "Fix verification or payout requirements on Stripe."
            : "Open Stripe-hosted Connect for this Business account."
        }
        onClick={() => {
          if (connecting) return;
          void openStripeConnectManagement("business", onFail, setConnecting);
        }}
        disabled={connecting}
      />
      <CanonicalMenuRow
        title={connecting ? "Opening Stripe…" : changeTitle}
        description="Update business payout bank details securely on Stripe."
        onClick={() => {
          if (connecting) return;
          void openStripeConnectManagement("business", onFail, setConnecting);
        }}
        disabled={connecting}
      />
    </>
  );
}
