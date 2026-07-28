"use client";

import { CanonicalSection, CanonicalMenuRow, CanonicalInfoBlock } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
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
            <CanonicalMenuRow title="Reset via email" icon={<LockLineIcon />} href="/forgot-password" />
          </div>
        </CanonicalSection>

        <CanonicalSection title="Two Factor Authentication">
          <div className="fw-engine__group">
            {/* Account Settings Engine v1.1 SSOT — 2FA is managed only on /account/profile */}
            <CanonicalMenuRow
              title="Two Factor Authentication"
              description={
                security
                  ? security.mfa.enabled
                    ? "On · manage in Account details"
                    : "Off · manage in Account details"
                  : "Manage in Account details"
              }
              icon={<ShieldLineIcon />}
              href="/account/profile#two-factor"
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
                icon={<PhoneLineIcon />}
                value="Active"
              />
            ) : (
              <CanonicalMenuRow title="Loading devices…" icon={<PhoneLineIcon />} disabled />
            )}
          </div>
        </CanonicalSection>

        <CanonicalSection title="Sessions">
          <div className="fw-engine__group">
            {session ? (
              <CanonicalMenuRow
                title="Sessions"
                description="Current session"
                icon={<PeopleLineIcon />}
                value="Active"
              />
            ) : (
              <CanonicalMenuRow title="Loading sessions…" icon={<PeopleLineIcon />} disabled />
            )}
            <CanonicalMenuRow
              title="Logout all devices"
              icon={<ShieldLineIcon />}
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
