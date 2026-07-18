"use client";

import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { CanonicalCard, CanonicalMenuRow, CanonicalInfoBlock } from "@/src/components/canonical";

type VerificationHubPageProps = {
  backHref?: string;
  backLabel?: string;
  context?: "account" | "business";
};

/**
 * Verification — Master Menu Design (same shell as Settings).
 * Business context never exits to My Account.
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
    >
      <CanonicalInfoBlock variant="description">
        {context === "business"
          ? "Verify your business to unlock Store, Orders, Wallet, and Analytics."
          : "Verify your ROVEXO account for buying and selling protection."}
      </CanonicalInfoBlock>

      <div className="cds-section">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            id="verification-trust"
            href="/trust#verification"
            title="Trust Centre"
            description="Score, badges, and verification status"
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
      </div>
    </AccountCanonicalShell>
  );
}
