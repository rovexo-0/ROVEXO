"use client";

import { useEffect, useState } from "react";
import { CanonicalInfoBlock, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";

type SecurityState = {
  mfa: {
    enabled: boolean;
    factorCount: number;
  };
};

export function AccountTwoFactorPage() {
  const [security, setSecurity] = useState<SecurityState | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/account/security");
        if (!response.ok) throw new Error("unavailable");
        const payload = (await response.json()) as SecurityState;
        if (!cancelled) setSecurity(payload);
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
        title="Two Factor Authentication"
        backHref="/account/security"
        backLabel="Security"
        showHeaderTitle
      >
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  const enabled = security?.mfa.enabled === true;

  return (
    <MyAccountTemplate
      surface="security"
      title="Two Factor Authentication"
      backHref="/account/security"
      backLabel="Security"
      showHeaderTitle
    >
      <div className="settings-subpage-v1 fw-engine__stack" data-full-width-surface="security-2fa">
        <CanonicalSection title="Status">
          <div className="fw-engine__group">
            <CanonicalMenuRow
              title="Two Factor Authentication"
              description={enabled ? "Authenticator app is enabled." : "Not enabled yet."}
              icon={<SettingsMenuIconGlyph name="shield" tone="rovexo-blue" />}
              value={enabled ? "On" : "Off"}
              showChevron={false}
            />
          </div>
        </CanonicalSection>

        <CanonicalSection title="How to manage 2FA">
          <CanonicalInfoBlock variant="description">
            {enabled
              ? "Your account is protected with an authenticator app. To change or remove 2FA, contact Support from Help Centre."
              : "Two-factor authentication adds a second step when you sign in. Contact Support from Help Centre to enable authenticator-based 2FA on your ROVEXO account."}
          </CanonicalInfoBlock>
          <div className="fw-engine__group">
            <CanonicalMenuRow
              title="Contact Support"
              description="Get help enabling or changing 2FA."
              icon={<SettingsMenuIconGlyph name="headset" tone="soft-red" />}
              href="/support?category=security"
            />
            <CanonicalMenuRow
              title="Help Centre"
              description="Security guides and FAQs."
              icon={<SettingsMenuIconGlyph name="info" tone="red" />}
              href="/help"
            />
          </div>
        </CanonicalSection>
      </div>
    </MyAccountTemplate>
  );
}
