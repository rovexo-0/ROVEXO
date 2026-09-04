"use client";

import { useState } from "react";
import { CanonicalMenuRow } from "@/src/components/canonical";
import { useToast } from "@/components/ui/Toast";

type HostedPayoutAccessRowProps = {
  sellerContext: "individual" | "business";
  enabled: boolean;
  restricted?: boolean;
};

/**
 * Opens Stripe-hosted Connect management for the transaction's seller context.
 * Never hard-codes Dashboard URLs; never trusts client-supplied account IDs.
 */
export function HostedPayoutAccessRow({
  sellerContext,
  enabled,
  restricted = false,
}: HostedPayoutAccessRowProps) {
  const { pushToast } = useToast();
  const [opening, setOpening] = useState(false);

  if (!enabled) return null;

  const title = restricted ? "Resolve on Stripe" : "View on Stripe";
  const description = restricted
    ? "A payout or verification issue needs attention."
    : "Open secure account management for this payout context.";

  return (
    <CanonicalMenuRow
      title={title}
      description={opening ? "Opening secure management…" : description}
      onClick={() => {
        if (opening) return;
        setOpening(true);
        void (async () => {
          try {
            const response = await fetch("/api/wallet/connect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ context: sellerContext, intent: "manage" }),
            });
            const payload = (await response.json()) as {
              success?: boolean;
              url?: string;
              error?: string;
            };
            if (payload.success && payload.url) {
              window.location.href = payload.url;
              return;
            }
            pushToast({
              title: "Unable to open secure management.",
              description: "Please try again from Bank Accounts.",
              variant: "error",
              durationMs: 2500,
            });
          } catch {
            pushToast({
              title: "Unable to open secure management.",
              description: "Please try again.",
              variant: "error",
              durationMs: 2500,
            });
          } finally {
            setOpening(false);
          }
        })();
      }}
      disabled={opening}
    />
  );
}
