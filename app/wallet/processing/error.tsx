"use client";

import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export default function WalletProcessingError({ reset }: { error: Error; reset: () => void }) {
  return (
    <AccountCanonicalShell
      title="Processing"
      backHref={WALLET_ROUTES.hub}
      backLabel="Balance"
      showHeaderTitle
    >
      <FailClosedPanel density="section" onRetry={() => reset()} />
    </AccountCanonicalShell>
  );
}
