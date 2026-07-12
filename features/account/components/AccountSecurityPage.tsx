"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { LockLineIcon, PeopleLineIcon, PhoneLineIcon, ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { PasswordChangeForm } from "@/features/account/components/PasswordChangeForm";

type SecurityState = {
  mfa: {
    enabled: boolean;
    factorCount: number;
  };
};

type SessionState = {
  current: {
    id: string;
    createdAt: string;
    lastSignInAt: string | null;
    expiresAt: string;
    provider: string;
  };
};

function formatDeviceLabel(): string {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "Apple mobile device";
  if (/Android/i.test(ua)) return "Android device";
  if (/Windows/i.test(ua)) return "Windows device";
  if (/Mac OS X/i.test(ua)) return "Mac device";
  return "This device";
}

export function AccountSecurityPage() {
  const [security, setSecurity] = useState<SecurityState | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [signingOutOthers, setSigningOutOthers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [securityResponse, sessionResponse] = await Promise.all([
        fetch("/api/account/security"),
        fetch("/api/account/sessions"),
      ]);
      const securityPayload = (await securityResponse.json()) as SecurityState;
      const sessionPayload = (await sessionResponse.json()) as SessionState;
      if (!cancelled) {
        setSecurity(securityPayload);
        setSession(sessionPayload);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signOutOtherSessions = async () => {
    setSigningOutOthers(true);
    setSessionMessage(null);
    const response = await fetch("/api/account/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sign_out_others" }),
    });
    setSigningOutOthers(false);
    setSessionMessage(
      response.ok ? "Signed out on all other devices." : "Unable to sign out other sessions.",
    );
  };

  return (
    <AccountCanonicalShell title="Password & Security" backHref="/account/settings">
      <CanonicalSection title="Password">
        <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
          <PasswordChangeForm />
          <CanonicalMenuRow title="Reset via email" icon={<LockLineIcon />} href="/forgot-password" />
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Devices & Sessions">
        <CanonicalCard variant="list">
          {session ? (
            <CanonicalMenuRow
              title={formatDeviceLabel()}
              description={`Current session · ${session.current.provider}`}
              icon={<PhoneLineIcon />}
              value="Active"
            />
          ) : (
            <CanonicalMenuRow title="Loading session…" icon={<PhoneLineIcon />} disabled />
          )}
          <CanonicalMenuRow
            title="Sign out all other devices"
            icon={<ShieldLineIcon />}
            onClick={() => void signOutOtherSessions()}
            disabled={signingOutOthers}
            value={signingOutOthers ? "Signing out…" : undefined}
          />
        </CanonicalCard>
        {sessionMessage ? (
          <CanonicalInfoBlock variant="description">{sessionMessage}</CanonicalInfoBlock>
        ) : null}
      </CanonicalSection>

      <CanonicalSection title="Two-factor authentication">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Authenticator app"
            description={
              security
                ? security.mfa.enabled
                  ? `${security.mfa.factorCount} verified factor(s) active.`
                  : "Two-factor authentication is not enabled yet."
                : "Loading security status…"
            }
            icon={<ShieldLineIcon />}
            value={security?.mfa.enabled ? "Enabled" : "Off"}
          />
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Privacy">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Blocked Users"
            description="Manage users you have blocked from contacting you"
            icon={<PeopleLineIcon />}
            href="/account/blocked-users"
          />
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
