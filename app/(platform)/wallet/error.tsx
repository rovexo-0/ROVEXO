"use client";

import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { AccountCanonicalShell } from "@/features/account-canonical";

export default function WalletError({ reset }: { error: Error; reset: () => void }) {
  return (
    <AccountCanonicalShell title="Balance" backHref="/account" backLabel="My Account" showHeaderTitle>
      <FailClosedPanel density="section" onRetry={() => reset()} />
    </AccountCanonicalShell>
  );
}
