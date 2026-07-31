"use client";

import { useEffect, useState } from "react";
import { CanonicalInfoBlock, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";

type SessionState = {
  current: {
    id: string;
    createdAt: string;
    lastSignInAt: string | null;
    expiresAt: string;
    provider: string;
  };
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AccountSessionsPage() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/account/sessions");
        if (!response.ok) throw new Error("unavailable");
        const payload = (await response.json()) as SessionState;
        if (!cancelled) setSession(payload);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signOutOtherSessions = async () => {
    setSigningOutOthers(true);
    setMessage(null);
    const response = await fetch("/api/account/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sign_out_others" }),
    });
    setSigningOutOthers(false);
    setMessage(response.ok ? "Signed out on all other devices." : "Unable to sign out other sessions.");
  };

  if (loadFailed) {
    return (
      <MyAccountTemplate
        surface="security"
        title="Sessions"
        backHref="/account/security"
        backLabel="Security"
        showHeaderTitle
      >
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  return (
    <MyAccountTemplate
      surface="security"
      title="Sessions"
      backHref="/account/security"
      backLabel="Security"
      showHeaderTitle
    >
      <div className="settings-subpage-v1 fw-engine__stack" data-full-width-surface="security-sessions">
        <CanonicalSection title="Current session">
          {!session ? (
            <CanonicalInfoBlock variant="description">Loading…</CanonicalInfoBlock>
          ) : (
            <div className="fw-engine__group">
              <CanonicalMenuRow
                title="This session"
                description={`Provider · ${session.current.provider}`}
                icon={<SettingsMenuIconGlyph name="people" tone="green" />}
                value="Active"
                showChevron={false}
              />
              <CanonicalMenuRow
                title="Expires"
                description={formatWhen(session.current.expiresAt)}
                showChevron={false}
              />
              <CanonicalMenuRow
                title="Last sign-in"
                description={formatWhen(session.current.lastSignInAt)}
                showChevron={false}
              />
            </div>
          )}
        </CanonicalSection>

        <CanonicalSection title="Other sessions">
          <div className="fw-engine__group">
            <CanonicalMenuRow
              title="Logout all other devices"
              description="Keep this device signed in."
              icon={<SettingsMenuIconGlyph name="shield" tone="red" />}
              onClick={() => void signOutOtherSessions()}
              disabled={signingOutOthers}
              value={signingOutOthers ? "Signing out…" : undefined}
            />
          </div>
          {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
        </CanonicalSection>
      </div>
    </MyAccountTemplate>
  );
}
