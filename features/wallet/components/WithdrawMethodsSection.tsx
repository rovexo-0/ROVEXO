"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { ChevronRightIcon } from "@/features/dashboard/icons";
import type { WithdrawMethod } from "@/lib/wallet/types";

type WithdrawMethodsSectionProps = {
  methods: WithdrawMethod[];
};

function providerLabel(provider: WithdrawMethod["provider"]): string {
  return provider === "bank_account" ? "Bank Account" : "Bank payouts";
}

function MethodCard({
  method,
  onConnect,
  connecting,
}: {
  method: WithdrawMethod;
  onConnect?: () => void;
  connecting?: boolean;
}) {
  const isConnect = method.provider === "stripe_connect";

  return (
    <Card padding="md" className={cn("", transitionFast, focusRing)}>
      <div className="flex min-h-[72px] items-center gap-ds-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-lg bg-surface-muted text-sm font-bold text-text-secondary">
          {method.provider === "bank_account" ? "BA" : "SC"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {providerLabel(method.provider)}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">•••• {method.lastDigits}</p>
          <Badge variant={method.connected ? "success" : "warning"} className="mt-ds-2">
            {method.connected ? "Connected" : "Not Connected"}
          </Badge>
        </div>

        {isConnect && !method.connected ? (
          <Button
            variant="outline"
            size="sm"
            disabled={connecting}
            onClick={onConnect}
          >
            {connecting ? "Opening…" : "Connect"}
          </Button>
        ) : (
          <a
            href="/seller/wallet/withdraw"
            className="flex shrink-0 items-center gap-ds-1 text-sm font-medium text-text-secondary"
          >
            Manage
            <ChevronRightIcon className="h-4 w-4" />
          </a>
        )}
      </div>
    </Card>
  );
}

export function WithdrawMethodsSection({ methods }: WithdrawMethodsSectionProps) {
  const [connecting, setConnecting] = useState(false);

  async function startConnect() {
    setConnecting(true);
    try {
      const response = await fetch("/api/wallet/connect", { method: "POST" });
      const payload = (await response.json()) as { success?: boolean; url?: string; error?: string };
      if (payload.success && payload.url) {
        window.location.href = payload.url;
        return;
      }
    } finally {
      setConnecting(false);
    }
  }

  return (
    <section aria-labelledby="wallet-withdraw-methods-heading" className="flex flex-col gap-ds-3">
      <h2 id="wallet-withdraw-methods-heading" className="text-base font-semibold text-text-primary">
        Withdraw Methods
      </h2>

      <div className="flex flex-col gap-ds-3">
        {methods.map((method) => (
          <MethodCard
            key={method.id}
            method={method}
            connecting={connecting}
            onConnect={method.provider === "stripe_connect" ? () => void startConnect() : undefined}
          />
        ))}
      </div>
    </section>
  );
}
