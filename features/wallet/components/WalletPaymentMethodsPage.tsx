"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { CardSetupSheet } from "@/features/account/components/CardSetupSheet";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { readReturnToParam } from "@/lib/navigation/return-to";
import type { SavedPaymentMethod } from "@/lib/payments/repository";
import { WALLET_CANONICAL_VERSION, WALLET_ROUTES, walletRouteWithReturn } from "@/lib/wallet/canonical-routes";
import type { UserProfile } from "@/lib/profile/types";

type WalletPaymentMethodsPageProps = {
  profile: UserProfile;
};

export function WalletPaymentMethodsPage({ profile }: WalletPaymentMethodsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = readReturnToParam(searchParams);
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [startingSetup, setStartingSetup] = useState(false);

  void profile;

  const loadMethods = async () => {
    const response = await fetch("/api/payment-methods");
    const payload = (await response.json()) as { methods?: SavedPaymentMethod[]; error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? `Unable to load cards (HTTP ${response.status}).`);
      setMethods([]);
    } else {
      setMethods(payload.methods ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const sessionId = searchParams.get("session_id");
    const setupSuccess = searchParams.get("setup") === "success" && sessionId;

    void (async () => {
      if (setupSuccess) {
        const completeResponse = await fetch("/api/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete_setup", sessionId }),
        });
        if (!completeResponse.ok) {
          const payload = (await completeResponse.json()) as { error?: string };
          if (!cancelled) {
            setMessage(payload.error ?? `Unable to save card (HTTP ${completeResponse.status}).`);
          }
        }
      }

      if (cancelled) return;
      await loadMethods();
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const addCard = async () => {
    setMessage(null);
    setStartingSetup(true);

    try {
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_setup_intent" }),
      });
      const payload = (await response.json()) as {
        clientSecret?: string;
        error?: string;
        code?: string;
      };

      if (!response.ok || !payload.clientSecret) {
        const detail = payload.error ?? `Card setup failed (HTTP ${response.status}).`;
        setMessage(payload.code ? `${detail} [${payload.code}]` : detail);
        return;
      }

      setClientSecret(payload.clientSecret);
      setSetupOpen(true);
    } catch {
      setMessage("Network error while starting card setup. Check your connection and try again.");
    } finally {
      setStartingSetup(false);
    }
  };

  const completeSetupIntent = async (setupIntentId: string) => {
    const response = await fetch("/api/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete_setup_intent", setupIntentId }),
    });
    const payload = (await response.json()) as { method?: SavedPaymentMethod; error?: string; code?: string };
    if (!response.ok || !payload.method) {
      const detail = payload.error ?? `Unable to save card (HTTP ${response.status}).`;
      throw new Error(payload.code ? `${detail} [${payload.code}]` : detail);
    }
    await loadMethods();
    setMessage("Card saved.");
    if (returnTo) {
      router.push(returnTo);
    }
  };

  const removeCard = async (id: string) => {
    const response = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setMessage(payload.error ?? `Unable to remove card (HTTP ${response.status}).`);
      return;
    }
    await loadMethods();
  };

  const setDefault = async (id: string) => {
    const response = await fetch(`/api/payment-methods/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_default" }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setMessage(payload.error ?? `Unable to update default card (HTTP ${response.status}).`);
      return;
    }
    await loadMethods();
  };

  const defaultMethod = methods.find((method) => method.isDefault) ?? methods[0] ?? null;

  return (
    <AccountCanonicalShell title="Payment Methods" backHref={WALLET_ROUTES.hub} backLabel="Wallet">
      <div data-wallet-payment-methods={WALLET_CANONICAL_VERSION}>
      <AccountPageStack
        className="wallet-payment-methods"
        aria-label="Payment methods"
      >
        <CanonicalSection title="Cards" intro="Debit and credit cards saved for checkout.">
          {loading ? <p className="account-settings-empty">Loading cards…</p> : null}
          {!loading && !methods.length ? (
            <p className="account-settings-empty">No saved cards yet.</p>
          ) : null}
          {!loading
            ? methods.map((method) => (
                <CanonicalCard key={method.id} variant="medium">
                  <div className="account-settings-payment-card">
                    <div>
                      <p className="account-settings-payment-card__title">{method.brand}</p>
                      <p className="account-settings-payment-card__meta">
                        •••• {method.last4} · {String(method.expMonth).padStart(2, "0")}/{method.expYear}
                        {method.isDefault ? " · Default" : ""}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {!method.isDefault ? (
                        <button
                          type="button"
                          className="account-settings-text-action"
                          onClick={() => void setDefault(method.id)}
                        >
                          Set Default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="account-settings-text-action account-settings-text-action--danger"
                        onClick={() => void removeCard(method.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </CanonicalCard>
              ))
            : null}
          <CanonicalButton type="button" fullWidth onClick={() => void addCard()} loading={startingSetup}>
            Add Card
          </CanonicalButton>
        </CanonicalSection>

        <CanonicalSection title="Bank Account" intro="Payout and withdrawal destination.">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Manage Bank Account"
              description="Sort code, account number, and verification status."
              href={walletRouteWithReturn(WALLET_ROUTES.bankAccount, returnTo)}
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Digital Wallets" intro="Available at checkout on supported devices.">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Apple Pay"
              description="Enabled when supported on your device at checkout."
              showChevron={false}
              value="Available"
            />
            <CanonicalMenuRow
              title="Google Pay"
              description="Enabled when supported on your device at checkout."
              showChevron={false}
              value="Available"
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Security">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Billing Address"
              description="Used for card verification at checkout."
              href={walletRouteWithReturn("/account/addresses", returnTo)}
            />
            <CanonicalMenuRow
              title="3D Secure"
              description="Strong Customer Authentication at checkout."
              showChevron={false}
              value="Supported"
            />
            <CanonicalMenuRow
              title="Default Payment"
              description="Used automatically at checkout."
              showChevron={false}
              value={defaultMethod ? `${defaultMethod.brand} •••• ${defaultMethod.last4}` : "None"}
            />
          </CanonicalCard>
        </CanonicalSection>

        {message ? (
          <CanonicalInfoBlock variant={message === "Card saved." ? "success" : "error"}>
            {message}
          </CanonicalInfoBlock>
        ) : null}
      </AccountPageStack>
      </div>

      {clientSecret ? (
        <CardSetupSheet
          open={setupOpen}
          clientSecret={clientSecret}
          onClose={() => {
            setSetupOpen(false);
            setClientSecret(null);
          }}
          onComplete={completeSetupIntent}
        />
      ) : null}
    </AccountCanonicalShell>
  );
}
