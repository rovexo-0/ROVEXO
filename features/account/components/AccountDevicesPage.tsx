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

function formatDeviceLabel(): string {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "Apple mobile device";
  if (/Android/i.test(ua)) return "Android device";
  if (/Windows/i.test(ua)) return "Windows device";
  if (/Mac OS X/i.test(ua)) return "Mac device";
  return "This device";
}

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

export function AccountDevicesPage() {
  const [session, setSession] = useState<SessionState | null>(null);
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

  if (loadFailed) {
    return (
      <MyAccountTemplate
        surface="security"
        title="Devices"
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
      title="Devices"
      backHref="/account/security"
      backLabel="Security"
      showHeaderTitle
    >
      <div className="settings-subpage-v1 fw-engine__stack" data-full-width-surface="security-devices">
        <CanonicalSection title="This device">
          {!session ? (
            <CanonicalInfoBlock variant="description">Loading…</CanonicalInfoBlock>
          ) : (
            <div className="fw-engine__group">
              <CanonicalMenuRow
                title={formatDeviceLabel()}
                description={`Signed in with ${session.current.provider}`}
                icon={<SettingsMenuIconGlyph name="phone" tone="blue" />}
                value="Active"
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
        <CanonicalInfoBlock variant="description">
          Manage other sessions from Sessions. Use Logout all devices to sign out everywhere else.
        </CanonicalInfoBlock>
      </div>
    </MyAccountTemplate>
  );
}
