"use client";

import { useState } from "react";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons/icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
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

  return (
    <section aria-labelledby="wallet-payout-setup-heading" className="flex flex-col gap-ds-3">
      <h2 id="wallet-payout-setup-heading" className="text-base font-semibold text-text-primary">
        Bank account
      </h2>

      <Card padding="md" className={cn("", transitionFast, focusRing)}>
        <div className="flex min-h-[72px] items-center gap-ds-3">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-lg bg-surface-muted"
          >
            <RovexoIcon icon={RovexoIcons.payments.payment} variant="category" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">Bank account</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Required to receive automatic payouts to your bank
            </p>
            <Badge variant={ready ? "success" : "warning"} className="mt-ds-2">
              {ready ? "Ready for payouts" : connectStatus.connected ? "Verification pending" : "Not added"}
            </Badge>
          </div>

          {!ready ? (
            <Button
              variant="outline"
              size="sm"
              disabled={connecting}
              onClick={() => void startConnect()}
            >
              {connecting ? "Opening…" : connectStatus.connected ? "Continue setup" : "Add bank"}
            </Button>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
