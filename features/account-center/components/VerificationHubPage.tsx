"use client";

import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";

type VerificationHubPageProps = {
  backHref?: string;
  backLabel?: string;
  context?: "account" | "business";
};

/**
 * Verification — same shell as My Account.
 */
export function VerificationHubPage({
  backHref = "/account",
  backLabel = "My Account",
  context = "account",
}: VerificationHubPageProps) {
  return (
    <AccountCanonicalShell
      title="Verification"
      backHref={backHref}
      backLabel={backLabel}
      showHeaderTitle
      intro={
        context === "business"
          ? "Verify your business profile."
          : "Verify your ROVEXO account."
      }
    >
      <div className="ac-canonical">
        <CanonicalSection title="Verification">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              id="verification-trust"
              href="/trust#verification"
              title="Trust Centre"
              description="Score and badges"
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="verification" />
                </span>
              }
            />
            <CanonicalMenuRow
              id="verification-settings"
              href="/account/settings"
              title="Settings"
              description="Account and security"
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="settings" />
                </span>
              }
            />
            {context === "business" ? (
              <CanonicalMenuRow
                id="verification-business-back"
                href="/business/dashboard"
                title="Business"
                description="Return to Business"
                icon={
                  <span className="ac-canonical__menu-icon" aria-hidden>
                    <AccountIcon name="business" />
                  </span>
                }
              />
            ) : null}
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
