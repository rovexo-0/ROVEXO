"use client";

import { useState } from "react";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons/icons";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { ConnectPayoutStatus } from "@/lib/wallet/types";

type PayoutSetupSectionProps = {
  connectStatus: ConnectPayoutStatus;
};

export function PayoutSetupSection({ connectStatus }: PayoutSetupSectionProps) {
  const [connecting, setConnecting] = useState(false);

  async function startConnect() {
    setConnecting(true);
    try {
      const response = await fetch("/api/wallet/connect", { method: "POST" });
      const payload = (await response.json()) as { success?: boolean; url?: string; error?: string };
      if (payload.success && payload.url) {
        window.location.href = payload.url;
      }
    } finally {
      setConnecting(false);
    }
  }

  const ready = connectStatus.connected && connectStatus.payoutsEnabled;
  const statusLabel = ready
    ? "Ready"
    : connectStatus.connected
      ? "Pending"
      : "Not added";

  return (
    <CanonicalSection title="Bank account">
      <CanonicalCard variant="list">
        <CanonicalMenuRow
          title="Bank account"
          description="Automatic payout destination"
          icon={<RovexoIcon icon={RovexoIcons.payments.payment} variant="category" />}
          value={statusLabel}
          showChevron={false}
          disabled={connecting}
          onClick={ready ? undefined : () => void startConnect()}
        />
      </CanonicalCard>
    </CanonicalSection>
  );
}
