"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import type { ConnectPayoutStatus } from "@/lib/wallet/types";

type SetupSnapshot = {
  stripeReady: boolean;
  shippingConfigured: boolean;
  hasStore: boolean;
  storeHref: string | null;
  username: string | null;
};

export function SellerSetupChecklist({
  sellerContext = "individual",
}: {
  sellerContext?: "individual" | "business";
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<SetupSnapshot>({
    stripeReady: false,
    shippingConfigured: false,
    hasStore: false,
    storeHref: null,
    username: null,
  });

  const loadSnapshot = useCallback(async () => {
    const [accountRes, shippingRes, profileRes] = await Promise.all([
      fetch(`/api/account/snapshot?sellerContext=${sellerContext}`, { credentials: "include" }),
      fetch("/api/account/seller-shipping", { credentials: "include" }),
      fetch("/api/profile", { credentials: "include" }),
    ]);

    const accountJson = accountRes.ok
      ? ((await accountRes.json()) as {
          wallet?: { connectStatus?: ConnectPayoutStatus } | null;
        })
      : null;
    const shippingJson = shippingRes.ok
      ? ((await shippingRes.json()) as { configured?: boolean })
      : null;
    const profileJson = profileRes.ok
      ? ((await profileRes.json()) as {
          profile?: { username?: string };
        })
      : null;

    const connect = accountJson?.wallet?.connectStatus;
    const username = profileJson?.profile?.username?.trim() || null;

    return {
      stripeReady: Boolean(connect?.connected && connect?.payoutsEnabled),
      shippingConfigured: Boolean(shippingJson?.configured),
      hasStore: Boolean(username),
      storeHref: username ? `/store/${encodeURIComponent(username)}` : null,
      username,
    } satisfies SetupSnapshot;
  }, [sellerContext]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      setSnapshot(await loadSnapshot());
    } catch {
      setMessage("Unable to load seller status. Try again.");
    } finally {
      setLoading(false);
    }
  }, [loadSnapshot]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await loadSnapshot();
        if (cancelled) return;
        setSnapshot(next);
      } catch {
        if (!cancelled) setMessage("Unable to load seller status. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSnapshot]);

  async function startStripe() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/wallet/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: sellerContext }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.success || !payload.url) {
        setMessage(payload.error ?? "Unable to open payout setup.");
        return;
      }
      window.location.href = payload.url;
    } catch {
      setMessage("Unable to open payout setup.");
    } finally {
      setBusy(false);
    }
  }

  const ready = useMemo(
    () => snapshot.stripeReady && snapshot.shippingConfigured && snapshot.hasStore,
    [snapshot],
  );

  if (loading) {
    return (
      <CanonicalSection title="Seller setup">
        <CanonicalCard variant="medium">
          <CanonicalInfoBlock variant="description">Loading seller status…</CanonicalInfoBlock>
        </CanonicalCard>
      </CanonicalSection>
    );
  }

  return (
    <>
      <CanonicalSection title="One-time setup">
        <CanonicalCard variant="medium">
          <CanonicalInfoBlock variant="description">
            Complete these steps once. Buyers are never forced through seller setup. Completed steps
            stay done.
          </CanonicalInfoBlock>
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Checklist">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="1. Payouts (Stripe)"
            description={snapshot.stripeReady ? "Connected" : "Required to sell"}
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="wallet" />
              </span>
            }
            value={snapshot.stripeReady ? "Done" : busy ? "Opening…" : "Set up"}
            showChevron={!snapshot.stripeReady}
            disabled={busy}
            onClick={snapshot.stripeReady ? undefined : () => void startStripe()}
          />
          <CanonicalMenuRow
            title="2. Shipping defaults"
            description={
              snapshot.shippingConfigured ? "Defaults saved" : "Handling, carrier and returns"
            }
            href="/seller/shipping"
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="shipping" />
              </span>
            }
            value={snapshot.shippingConfigured ? "Done" : "Configure"}
          />
          <CanonicalMenuRow
            title="3. Store"
            description={snapshot.username ? `@${snapshot.username}` : "Your public shop"}
            href={snapshot.storeHref ?? "/account/profile"}
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="stores" />
              </span>
            }
            value={snapshot.hasStore ? "Open" : "Profile"}
          />
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Status">
        <CanonicalCard variant="medium">
          <CanonicalInfoBlock variant="description">
            {ready
              ? "Ready to sell. List an item when you are ready."
              : "Finish the steps above to sell on ROVEXO."}
          </CanonicalInfoBlock>
          {message ? (
            <CanonicalInfoBlock variant="error">{message}</CanonicalInfoBlock>
          ) : null}
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <button type="button" className="btn btn--secondary" onClick={() => void refresh()} disabled={busy}>
              Refresh status
            </button>
            {ready ? (
              <Link href="/sell" className="btn btn--primary">
                Sell an item
              </Link>
            ) : null}
            {snapshot.storeHref ? (
              <Link href={snapshot.storeHref} className="btn btn--secondary">
                View store
              </Link>
            ) : null}
          </div>
        </CanonicalCard>
      </CanonicalSection>
    </>
  );
}
