"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { MonetizationPlan, MonetizationProduct, MonetizationSubscription } from "@/lib/monetization/types";

type PlansPageProps = {
  plans: MonetizationPlan[];
  products: MonetizationProduct[];
  subscription: MonetizationSubscription | null;
};

function planPrice(plan: MonetizationPlan): string {
  if (plan.priceCents === 0) return "Free";
  return `£${(plan.priceCents / 100).toFixed(2)}/${plan.interval}`;
}

/** Absolute Final: Plans as Master Menu rows — no pricing cards grid. */
export function PlansPage({ plans, products, subscription }: PlansPageProps) {
  const router = useRouter();
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async (planSlug: string) => {
    setBusySlug(planSlug);
    setError(null);
    try {
      const response = await fetch("/api/monetization/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Unable to start checkout.");
        return;
      }
      window.location.href = payload.url;
    } finally {
      setBusySlug(null);
    }
  };

  const cancel = async () => {
    setBusySlug("cancel");
    setError(null);
    try {
      const response = await fetch("/api/monetization/subscription", { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "Unable to cancel subscription.");
        return;
      }
      router.refresh();
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5">
      <CanonicalInfoBlock variant="description">
        Choose a plan that fits how you buy and sell on ROVEXO.
      </CanonicalInfoBlock>

      {subscription ? (
        <CanonicalSection title="Current">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Plan" value={subscription.planName} showChevron={false} />
            <div className="px-0 py-ds-2">
              <CanonicalButton
                variant="secondary"
                disabled={busySlug === "cancel"}
                onClick={() => void cancel()}
              >
                Cancel subscription
              </CanonicalButton>
            </div>
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <CanonicalSection title="Plans">
        <CanonicalCard variant="list">
          {plans.map((plan) => (
            <CanonicalMenuRow
              key={plan.id}
              title={plan.name}
              description={plan.features.map((f) => f.replace(/_/g, " ")).join(" · ")}
              value={planPrice(plan)}
              showChevron={false}
              trailing={
                <CanonicalButton
                  variant={subscription?.planSlug === plan.slug ? "secondary" : "primary"}
                  disabled={busySlug === plan.slug || subscription?.planSlug === plan.slug}
                  onClick={() => void subscribe(plan.slug)}
                >
                  {subscription?.planSlug === plan.slug
                    ? "Current"
                    : plan.priceCents === 0
                      ? "Activate"
                      : "Subscribe"}
                </CanonicalButton>
              }
            />
          ))}
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Add-ons">
        <CanonicalCard variant="list">
          {products.map((product) => (
            <CanonicalMenuRow
              key={product.id}
              title={product.title}
              description={product.description}
              value={product.priceLabel}
              href={product.href ?? undefined}
              showChevron={Boolean(product.href)}
            />
          ))}
        </CanonicalCard>
      </CanonicalSection>
    </div>
  );
}
