"use client";

import { CanonicalSection, CanonicalMenuRow, CanonicalInfoBlock } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";
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
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [securityResponse, sessionResponse] = await Promise.all([
          fetch("/api/account/security"),
          fetch("/api/account/sessions"),
        ]);
        if (!securityResponse.ok || !sessionResponse.ok) throw new Error("unavailable");
        const securityPayload = (await securityResponse.json()) as SecurityState;
        const sessionPayload = (await sessionResponse.json()) as SessionState;
        if (!cancelled) {
          setSecurity(securityPayload);
          setSession(sessionPayload);
        }
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

  if (loadFailed) {
    return (
      <MyAccountTemplate surface="security" title="Security" backHref="/account/settings" showHeaderTitle>
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  return (
    <MyAccountTemplate surface="security" title="Security" backHref="/account/settings" showHeaderTitle>
      <div className="settings-subpage-v1 fw-engine__stack" data-settings-security="v1.0" data-full-width-surface="security">
        <CanonicalSection title="Change Password">
          <div className="fw-engine__group flex flex-col gap-ds-4">
            <PasswordChangeForm />
            <CanonicalMenuRow
              title="Reset via email"
              icon={<SettingsMenuIconGlyph name="lock" tone="red" />}
              href="/account/security/reset-via-email"
            />
          </div>
        </CanonicalSection>

        <CanonicalSection title="Two Factor Authentication">
          <div className="fw-engine__group">
            <CanonicalMenuRow
              title="Two Factor Authentication"
              description={
                security
                  ? security.mfa.enabled
                    ? "On · manage 2FA"
                    : "Off · set up 2FA"
                  : "Manage 2FA"
              }
              icon={<SettingsMenuIconGlyph name="shield" tone="rovexo-blue" />}
              href="/account/security/two-factor"
              value={security?.mfa.enabled ? "On" : "Off"}
            />
          </div>
        </CanonicalSection>

        <CanonicalSection title="Devices">
          <div className="fw-engine__group">
            {session ? (
              <CanonicalMenuRow
                title="Devices"
                description={`${formatDeviceLabel()} · ${session.current.provider}`}
                icon={<SettingsMenuIconGlyph name="phone" tone="blue" />}
                href="/account/security/devices"
                value="Active"
              />
            ) : (
              <CanonicalMenuRow
                title="Loading devices…"
                icon={<SettingsMenuIconGlyph name="phone" tone="blue" />}
                disabled
              />
            )}
          </div>
        </CanonicalSection>

        <CanonicalSection title="Sessions">
          <div className="fw-engine__group">
            {session ? (
              <CanonicalMenuRow
                title="Sessions"
                description="Current session"
                icon={<SettingsMenuIconGlyph name="people" tone="green" />}
                href="/account/security/sessions"
                value="Active"
              />
            ) : (
              <CanonicalMenuRow
                title="Loading sessions…"
                icon={<SettingsMenuIconGlyph name="people" tone="green" />}
                disabled
              />
            )}
            <CanonicalMenuRow
              title="Logout all devices"
              icon={<SettingsMenuIconGlyph name="shield" tone="red" />}
              onClick={() => void signOutOtherSessions()}
              disabled={signingOutOthers}
              value={signingOutOthers ? "Signing out…" : undefined}
            />
          </div>
          {sessionMessage ? (
            <CanonicalInfoBlock variant="description">{sessionMessage}</CanonicalInfoBlock>
          ) : null}
        </CanonicalSection>
      </div>
    </MyAccountTemplate>
  );
}
