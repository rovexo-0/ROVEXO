"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { CardSetupSheet } from "@/features/account/components/CardSetupSheet";
import { WalletHelpHeaderAction } from "@/features/wallet/components/WalletProfileChrome";
import {
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  PrimaryButton,
} from "@/src/components/canonical";
import { ADDRESSES_ROUTE } from "@/lib/addresses/freeze";
import { readReturnToParam } from "@/lib/navigation/return-to";
import type { SavedPaymentMethod } from "@/lib/payments/repository";
import {
  formatPaymentBrandTitle,
  formatSavedCardExpiry,
  formatSavedCardMask,
} from "@/lib/payments/format";
import { detectWalletPayments, type DetectedWalletPayments } from "@/lib/payments/wallet-detection";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import type { UserProfile } from "@/lib/profile/types";
import "@/styles/rovexo/payment-methods-v4.css";

export const PAYMENT_METHODS_UI_VERSION = "v5.0" as const;
export const PAYMENT_METHODS_UI_DOM = "v5.0-fail-closed-empty" as const;

const EMPTY_WALLETS: DetectedWalletPayments = { applePay: false, googlePay: false };
const SUCCESS_CARD_SAVED = "Card saved.";

function subscribeNoop() {
  return () => undefined;
}

/** Stable client snapshot — React requires getSnapshot to return cached equals. */
let clientWalletsSnapshot: DetectedWalletPayments = EMPTY_WALLETS;

function getClientWalletsSnapshot(): DetectedWalletPayments {
  const next = detectWalletPayments();
  if (
    next.applePay === clientWalletsSnapshot.applePay &&
    next.googlePay === clientWalletsSnapshot.googlePay
  ) {
    return clientWalletsSnapshot;
  }
  clientWalletsSnapshot = next;
  return clientWalletsSnapshot;
}

function useDetectedWallets(): DetectedWalletPayments {
  return useSyncExternalStore(subscribeNoop, getClientWalletsSnapshot, () => EMPTY_WALLETS);
}

export type WalletPaymentMethodsPageProps = {
  profile: UserProfile;
  /** Live billing address presence — false on missing / load failure (empty, not error). */
  billingConfigured?: boolean;
};

/**
 * Payment Methods v5.0 — Absolute Authority.
 * Profile Master inheritance. Allowed UI states only: Loading · Empty · Functional · Success.
 * Fail-closed protects Stripe/API/security — never blocks this UI with Retry / error pages.
 * API/Stripe/DB/network/no-data → Empty State. Apple/Google Pay off-device → hide row.
 */
export function WalletPaymentMethodsPage({
  profile,
  billingConfigured = false,
}: WalletPaymentMethodsPageProps) {
  void profile;
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = readReturnToParam(searchParams);
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [setupPaused, setSetupPaused] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [startingSetup, setStartingSetup] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { applePay, googlePay } = useDetectedWallets();

  const loadMethods = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payment-methods");
      if (!response.ok) {
        setMethods([]);
        return;
      }
      const payload = (await response.json()) as { methods?: SavedPaymentMethod[] };
      setMethods(payload.methods ?? []);
    } catch {
      // Stripe / API / network / DB → Empty State (never error page)
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const sessionId = searchParams.get("session_id");
    const setupSuccess = searchParams.get("setup") === "success" && sessionId;

    void (async () => {
      if (setupSuccess) {
        try {
          await fetch("/api/payment-methods", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "complete_setup", sessionId }),
          });
        } catch {
          // swallow — page still renders empty/functional
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
    setSuccessMessage(null);
    setSetupPaused(false);
    setStartingSetup(true);

    try {
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_setup_intent" }),
      });
      const payload = (await response.json()) as { clientSecret?: string };

      if (!response.ok || !payload.clientSecret) {
        setSetupPaused(true);
        return;
      }

      setClientSecret(payload.clientSecret);
      setSetupOpen(true);
    } catch {
      setSetupPaused(true);
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
    const payload = (await response.json()) as { method?: SavedPaymentMethod };
    if (!response.ok || !payload.method) {
      return;
    }
    await loadMethods();
    setSuccessMessage(SUCCESS_CARD_SAVED);
    if (returnTo) {
      router.push(returnTo);
    }
  };

  const removeCard = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
      if (!response.ok) return;
      setSelectedId(null);
      await loadMethods();
    } catch {
      // keep functional UI
    }
  };

  const setDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_default" }),
      });
      if (!response.ok) return;
      setSelectedId(null);
      await loadMethods();
    } catch {
      // keep functional UI
    }
  };

  const hasCards = methods.length > 0;
  const defaultMethod = methods.find((method) => method.isDefault) ?? null;
  const addressesHref = `${ADDRESSES_ROUTE}?returnTo=${encodeURIComponent(WALLET_ROUTES.paymentMethods)}`;

  return (
    <AccountCanonicalShell
      title="Payment Methods"
      backHref={WALLET_ROUTES.hub}
      backLabel="Balance"
      showHeaderTitle
      rightAction={<WalletHelpHeaderAction />}
      dataMyAccountSurface="payments"
    >
      <div
        className="pm-profile fw-engine__stack"
        data-payment-methods-ui={PAYMENT_METHODS_UI_VERSION}
        data-payment-methods-lock={PAYMENT_METHODS_UI_DOM}
        data-profile-master="v7.0"
        data-design-master="profile"
        data-full-width-surface="payments"
        data-icon-system="profile-v1.0"
        data-fail-closed="v2-empty-only"
        data-pm-state={loading ? "loading" : hasCards ? "success" : "empty"}
      >
        <AccountPageStack aria-label="Payment methods">
          {loading ? (
            <CanonicalCard variant="list" className="pm-profile__list" data-pm-loading="true">
              <CanonicalMenuRow title="Loading…" description="Payment methods" showChevron={false} />
            </CanonicalCard>
          ) : null}

          {!loading && !hasCards ? (
            <section className="pm-profile__empty" data-pm-empty="true" aria-label="Empty payment methods">
              <p className="pm-profile__empty-title">No payment methods added yet.</p>
              <p className="pm-profile__empty-copy">Your payment methods are secured by Stripe.</p>
              <PrimaryButton
                loading={startingSetup}
                onClick={() => void addCard()}
                data-pm-cta="add-card"
              >
                Add Card
              </PrimaryButton>
            </section>
          ) : null}

          {!loading && hasCards ? (
            <CanonicalCard variant="list" className="pm-profile__list" data-pm-cards="true">
              {methods.map((method) => {
                const open = selectedId === method.id;
                return (
                  <div key={method.id}>
                    <CanonicalMenuRow
                      title={formatPaymentBrandTitle(method.brand)}
                      description={`${formatSavedCardMask(method)} · ${formatSavedCardExpiry(method)}`}
                      value={method.isDefault ? "DEFAULT CARD" : undefined}
                      onClick={() => setSelectedId(open ? null : method.id)}
                      showChevron
                    />
                        {open ? (
                          <>
                            {!method.isDefault ? (
                              <CanonicalMenuRow
                                title="Set as default"
                                onClick={() => void setDefault(method.id)}
                                showChevron={false}
                              />
                            ) : null}
                            <CanonicalMenuRow
                              title="Replace card"
                              description="Add a new card to update card details."
                              onClick={() => void addCard()}
                              showChevron={false}
                            />
                            <CanonicalMenuRow
                              title="Remove"
                              destructive
                              onClick={() => void removeCard(method.id)}
                              hideChevron
                            />
                          </>
                        ) : null}
                  </div>
                );
              })}
            </CanonicalCard>
          ) : null}

          {!loading ? (
            <CanonicalCard variant="list" className="pm-profile__list" data-pm-secondary="true">
              {applePay ? (
                <CanonicalMenuRow
                  title="Apple Pay"
                  description={hasCards ? "Enabled." : "Available at checkout."}
                  showChevron={false}
                />
              ) : null}
              {googlePay ? (
                <CanonicalMenuRow
                  title="Google Pay"
                  description={hasCards ? "Enabled." : "Available at checkout."}
                  showChevron={false}
                />
              ) : null}
              <CanonicalMenuRow
                href={addressesHref}
                title="Billing Address"
                description={
                  billingConfigured ? "Configured." : "Manage your billing details."
                }
              />
              {!hasCards ? (
                <CanonicalMenuRow
                  title="Default Payment Method"
                  description="Not configured yet."
                  showChevron={false}
                />
              ) : (
                <CanonicalMenuRow
                  title="Default Payment Method"
                  description={
                    defaultMethod
                      ? `${formatPaymentBrandTitle(defaultMethod.brand)} ${formatSavedCardMask(defaultMethod)}`
                      : "Not configured yet."
                  }
                  onClick={() => {
                    if (defaultMethod) setSelectedId(defaultMethod.id);
                  }}
                  showChevron
                />
              )}
            </CanonicalCard>
          ) : null}

          {!loading && hasCards ? (
            <div className="pm-profile__cta">
              <PrimaryButton
                loading={startingSetup}
                onClick={() => void addCard()}
                data-pm-cta="add-new-card"
              >
                Add New Card
              </PrimaryButton>
            </div>
          ) : null}

          {setupPaused ? (
            <CanonicalInfoBlock>
              Card setup is temporarily paused. Your payment methods remain secured by Stripe.
            </CanonicalInfoBlock>
          ) : null}

          {successMessage ? (
            <CanonicalInfoBlock variant="success">{successMessage}</CanonicalInfoBlock>
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
          onComplete={async (setupIntentId) => {
            await completeSetupIntent(setupIntentId);
          }}
        />
      ) : null}
    </AccountCanonicalShell>
  );
}
