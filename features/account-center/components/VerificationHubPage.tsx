"use client";

import { MyAccountTemplate } from "@/features/account-canonical";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";
import { CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { SETTINGS_V1_VERIFICATION_ROWS } from "@/lib/settings/settings-v1";
import "@/styles/rovexo/account-settings-canonical.css";

type VerificationHubPageProps = {
  backHref?: string;
  backLabel?: string;
  context?: "account" | "business";
  loadFailed?: boolean;
};

function statusForRow(id: string): string {
  if (id === "rovexo-verified") return "Not Verified";
  return "Not Started";
}

/**
 * Settings → Verification — Full Width Engine v1.0 (Profile reference).
 */
export function VerificationHubPage({
  backHref = "/account/settings",
  backLabel = "Settings",
  context = "account",
  loadFailed = false,
}: VerificationHubPageProps) {
  if (loadFailed) {
    return (
      <MyAccountTemplate surface="verification" title="Verification" backHref={backHref} backLabel={backLabel} showHeaderTitle>
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  return (
    <MyAccountTemplate
      surface="verification"
      title="Verification"
      backHref={backHref}
      backLabel={backLabel}
      showHeaderTitle
      intro={
        context === "business"
          ? "Verify your business profile."
          : "Identity verification for your ROVEXO account."
      }
    >
      <div className="settings-subpage-v1 fw-engine__stack" data-settings-verification="v1.0" data-full-width-surface="verification">
        <CanonicalSection title="Identity Verification">
          <div className="fw-engine__group">
            {SETTINGS_V1_VERIFICATION_ROWS.map((row) => (
              <CanonicalMenuRow
                key={row.id}
                id={`verification-${row.id}`}
                title={row.title}
                description="Status"
                value={statusForRow(row.id)}
                icon={<SettingsMenuIconGlyph name="shield" tone="rovexo-blue" />}
                href="/trust#verification"
              />
            ))}
          </div>
        </CanonicalSection>
      </div>
    </MyAccountTemplate>
  );
}
