"use client";

import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

function WalletBucketError({
  title,
  reset,
}: {
  title: string;
  reset: () => void;
}) {
  return (
    <AccountCanonicalShell title={title} backHref={WALLET_ROUTES.hub} backLabel="Balance" showHeaderTitle>
      <FailClosedPanel density="section" onRetry={() => reset()} />
    </AccountCanonicalShell>
  );
}

export default function WalletPendingError({ reset }: { error: Error; reset: () => void }) {
  return <WalletBucketError title="Pending" reset={reset} />;
}
