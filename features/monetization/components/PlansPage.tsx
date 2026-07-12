"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MonetizationPlan, MonetizationProduct, MonetizationSubscription } from "@/lib/monetization/types";

type PlansPageProps = {
  plans: MonetizationPlan[];
  products: MonetizationProduct[];
  subscription: MonetizationSubscription | null;
};

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
    <div className="flex flex-col gap-ds-8">
      <section>
        <p className="text-sm text-text-secondary">
          Choose a subscription or add-on that fits how you buy and sell on ROVEXO.
        </p>
        {subscription ? (
          <div className="mt-ds-3 flex flex-wrap items-center gap-ds-3">
            <p className="text-sm text-text-primary">
              Current plan: <Badge>{subscription.planName}</Badge>
            </p>
            <Button variant="secondary" disabled={busySlug === "cancel"} onClick={() => void cancel()}>
              Cancel subscription
            </Button>
          </div>
        ) : null}
        {error ? <p className="mt-ds-2 text-sm text-red-600">{error}</p> : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Subscription plans</h2>
        <div className="mt-ds-4 grid gap-ds-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} padding="lg" className="">
              <p className="font-semibold text-text-primary">{plan.name}</p>
              <p className="mt-ds-1 text-2xl font-bold text-primary">
                {plan.priceCents === 0 ? "Free" : `£${(plan.priceCents / 100).toFixed(2)}/${plan.interval}`}
              </p>
              <ul className="mt-ds-4 space-y-ds-1 text-sm text-text-secondary">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature.replace(/_/g, " ")}</li>
                ))}
              </ul>
              <Button
                className="mt-ds-4 w-full"
                variant={subscription?.planSlug === plan.slug ? "secondary" : "primary"}
                disabled={busySlug === plan.slug || subscription?.planSlug === plan.slug}
                onClick={() => void subscribe(plan.slug)}
              >
                {subscription?.planSlug === plan.slug ? "Current plan" : plan.priceCents === 0 ? "Activate free" : "Subscribe"}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Monetization products</h2>
        <div className="mt-ds-4 grid gap-ds-3 sm:grid-cols-2">
          {products.map((product) => (
            <Card key={product.id} padding="md" className="">
              <div className="flex items-start justify-between gap-ds-3">
                <div>
                  <p className="font-semibold text-text-primary">{product.title}</p>
                  <p className="mt-ds-1 text-sm text-text-secondary">{product.description}</p>
                </div>
                <Badge>{product.priceLabel}</Badge>
              </div>
              {product.href ? (
                <a href={product.href} className="mt-ds-3 inline-flex text-sm font-medium text-primary hover:underline">
                  Open
                </a>
              ) : null}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
