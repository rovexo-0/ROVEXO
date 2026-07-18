"use client";

import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  BusinessWalletMenuSections,
  PersonalWalletMenuSections,
} from "@/features/wallet/components/WalletMenuSections";
import {
  CanonicalCard,
  CanonicalMenuRow,
} from "@/src/components/canonical";
import { resolveManualWithdrawableBalance } from "@/lib/transaction-hub/seller-wallet";
import { WALLET_CANONICAL_VERSION, WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency } from "@/lib/wallet/utils";
import type { WalletData } from "@/lib/wallet/types";

type WalletHubV1Props = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
  variant?: "personal" | "business";
};

/**
 * Wallet — My Account Master Menu only.
 * Available · Pending · Withdraw · Transactions · Bank accounts.
 */
export function WalletHubV1({
  data,
  backHref = "/account",
  connectMessage,
  variant = "personal",
}: WalletHubV1Props) {
  const withdrawable = resolveManualWithdrawableBalance(data);
  const isBusiness = variant === "business";
  const title = isBusiness ? "Business Wallet" : "Wallet";

  return (
    <AccountCanonicalShell
      title={title}
      backHref={isBusiness ? "/business/dashboard" : backHref}
      backLabel={isBusiness ? "Business" : "My Account"}
      showHeaderTitle
      intro={connectMessage}
    >
      <div
        className="ac-canonical"
        data-wallet-hub-version="v3.0-standard"
        data-wallet-canonical={WALLET_CANONICAL_VERSION}
        data-wallet-variant={variant}
      >
        <div className="cds-section">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Available"
              value={formatCurrency(withdrawable)}
              showChevron={false}
            />
            <CanonicalMenuRow
              title="Pending"
              value={formatCurrency(data.pendingBalance)}
              href="/wallet/pending"
            />
            <CanonicalMenuRow
              title="Withdraw"
              href={withdrawable > 0 ? WALLET_ROUTES.withdraw : undefined}
              disabled={withdrawable <= 0}
            />
          </CanonicalCard>
        </div>

        {isBusiness ? <BusinessWalletMenuSections /> : <PersonalWalletMenuSections />}
      </div>
    </AccountCanonicalShell>
  );
}
