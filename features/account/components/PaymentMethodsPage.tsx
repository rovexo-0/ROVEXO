"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { SavedPaymentMethod } from "@/lib/payments/repository";
import type { UserProfile } from "@/lib/profile/types";

type PaymentMethodsPageProps = {
  profile: UserProfile;
};

export function PaymentMethodsPage({ profile }: PaymentMethodsPageProps) {
  const searchParams = useSearchParams();
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadMethods = async () => {
    const response = await fetch("/api/payment-methods");
    const payload = (await response.json()) as { methods: SavedPaymentMethod[] };
    setMethods(payload.methods ?? []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const sessionId = searchParams.get("session_id");
    const setupSuccess = searchParams.get("setup") === "success" && sessionId;

    void (async () => {
      if (setupSuccess) {
        await fetch("/api/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete_setup", sessionId }),
        });
      }

      const response = await fetch("/api/payment-methods");
      if (cancelled) return;
      const payload = (await response.json()) as { methods: SavedPaymentMethod[] };
      setMethods(payload.methods ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const addCard = async () => {
    setMessage(null);
    const response = await fetch("/api/payment-methods", { method: "POST" });
    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      setMessage(payload.error ?? "Unable to start card setup.");
      return;
    }
    window.location.href = payload.url;
  };

  const removeCard = async (id: string) => {
    await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
    await loadMethods();
  };

  const setDefault = async (id: string) => {
    await fetch(`/api/payment-methods/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_default" }),
    });
    await loadMethods();
  };

  return (
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-6 px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
        <div>
          <Link href="/account/profile" className="text-sm font-medium text-primary hover:underline">
            ← Account
          </Link>
          <h1 className="mt-ds-3 text-2xl font-bold text-text-primary">Payment methods</h1>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Save cards for faster checkout. Seller payouts use Stripe Connect.
          </p>
        </div>

        <section className="premium-card p-ds-5">
          <h2 className="text-base font-semibold text-text-primary">Buyer cards</h2>
          <div className="mt-ds-4 flex flex-col gap-ds-3">
            {loading ? <p className="text-sm text-text-secondary">Loading cards…</p> : null}
            {!loading && !methods.length ? (
              <p className="text-sm text-text-secondary">No saved cards yet.</p>
            ) : null}
            {methods.map((method) => (
              <article key={method.id} className="rounded-ds-lg border border-border p-ds-4">
                <div className="flex items-center justify-between gap-ds-3">
                  <div>
                    <p className="font-semibold capitalize text-text-primary">{method.brand}</p>
                    <p className="text-sm text-text-secondary">
                      •••• {method.last4} · {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                  {method.isDefault ? <Badge>Default</Badge> : null}
                </div>
                <div className="mt-ds-3 flex flex-wrap gap-ds-2">
                  {!method.isDefault ? (
                    <Button type="button" variant="secondary" size="sm" onClick={() => void setDefault(method.id)}>
                      Make default
                    </Button>
                  ) : null}
                  <Button type="button" variant="ghost" size="sm" onClick={() => void removeCard(method.id)}>
                    Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <Button type="button" variant="primary" className="mt-ds-4" onClick={() => void addCard()}>
            Add card
          </Button>
          {message ? <p className="mt-ds-2 text-sm text-danger">{message}</p> : null}
        </section>

        {profile.isSeller ? (
          <section className="premium-card p-ds-5">
            <h2 className="text-base font-semibold text-text-primary">Seller payouts</h2>
            <p className="mt-ds-1 text-sm text-text-secondary">
              Connect your bank account with Stripe to receive payouts securely.
            </p>
            <Link href="/seller/wallet" className="mt-ds-4 inline-flex">
              <Button variant="secondary">Open seller wallet</Button>
            </Link>
          </section>
        ) : null}
      </main>
    </BetaAppShell>
  );
}
