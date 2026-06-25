"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
    <AccountPageShell
      title="Account security"
      subtitle="Manage your password, sessions, and two-factor authentication."
      backHref="/settings"
      backLabel="Settings"
    >
      <div className="flex flex-col gap-ds-4">
        <section className="premium-card p-ds-5">
          <h2 className="text-base font-semibold text-text-primary">Password</h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Change your password securely without leaving ROVEXO.
          </p>
          <div className="mt-ds-4">
            <PasswordChangeForm />
          </div>
          <Link href="/forgot-password" className="mt-ds-3 inline-flex text-sm font-medium text-primary">
            Reset via email
          </Link>
        </section>

        <section className="premium-card p-ds-5">
          <h2 className="text-base font-semibold text-text-primary">Sessions & devices</h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Review your active session and sign out everywhere else if needed.
          </p>
          {session ? (
            <div className="mt-ds-4 rounded-ds-lg border border-border bg-surface-muted p-ds-4">
              <div className="flex items-center justify-between gap-ds-3">
                <div>
                  <p className="font-medium text-text-primary">{formatDeviceLabel()}</p>
                  <p className="mt-ds-1 text-xs text-text-secondary">Current session · {session.current.provider}</p>
                </div>
                <Badge>Active</Badge>
              </div>
              <p className="mt-ds-3 text-xs text-text-muted">
                Last sign-in:{" "}
                {session.current.lastSignInAt
                  ? new Date(session.current.lastSignInAt).toLocaleString("en-GB")
                  : "Unknown"}
              </p>
              <p className="text-xs text-text-muted">
                Expires: {new Date(session.current.expiresAt).toLocaleString("en-GB")}
              </p>
            </div>
          ) : (
            <p className="mt-ds-3 text-sm text-text-secondary">Loading session…</p>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-ds-4"
            disabled={signingOutOthers}
            onClick={() => void signOutOtherSessions()}
          >
            {signingOutOthers ? "Signing out…" : "Sign out all other devices"}
          </Button>
          {sessionMessage ? <p className="mt-ds-2 text-sm text-text-secondary">{sessionMessage}</p> : null}
        </section>

        <section className="premium-card p-ds-5">
          <div className="flex items-center justify-between gap-ds-3">
            <h2 className="text-base font-semibold text-text-primary">Two-factor authentication</h2>
            {security?.mfa.enabled ? <Badge>Enabled</Badge> : <Badge variant="default">Off</Badge>}
          </div>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Add an authenticator app for an extra layer of protection on your ROVEXO account.
          </p>
          {security ? (
            <p className="mt-ds-3 text-sm text-text-secondary">
              {security.mfa.enabled
                ? `${security.mfa.factorCount} verified authenticator factor(s) active.`
                : "Two-factor authentication is not enabled yet."}
            </p>
          ) : (
            <p className="mt-ds-3 text-sm text-text-secondary">Loading security status…</p>
          )}
        </section>

        <section className="premium-card p-ds-5">
          <h2 className="text-base font-semibold text-text-primary">Blocked users</h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Manage users you have blocked from contacting you.
          </p>
          <Link href="/account/blocked-users" className="mt-ds-4 inline-flex">
            <Button variant="secondary" size="sm">
              Manage blocked users
            </Button>
          </Link>
        </section>
      </div>
    </AccountPageShell>
  );
}
