"use client";

import { AccountCanonicalShell } from "@/features/account-canonical";
import { TrustVerificationActions } from "@/features/trust/components/TrustVerificationActions";
import type { TrustDashboardData } from "@/lib/trust/types";
import { TRUST_CENTER_SECTIONS } from "@/lib/trust/types";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

type TrustCenterPageProps = {
  data: TrustDashboardData;
};

/**
 * Trust Centre — same Master Menu Design as My Account.
 * No score meter heroes. No giant cards. Compact rows only.
 */
export function TrustCenterPage({ data }: TrustCenterPageProps) {
  return (
    <AccountCanonicalShell
      title="Trust Centre"
      backHref="/account"
      backLabel="My Account"
      showHeaderTitle
      intro="Protection, verification, and safety."
    >
      <div className="ac-canonical">
        <CanonicalSection title="Score">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Trust Score"
              description={data.score.tier}
              value={String(data.score.score)}
              showChevron={false}
            />
            <CanonicalMenuRow title="Buyer" value={String(data.score.buyerScore)} showChevron={false} />
            <CanonicalMenuRow title="Seller" value={String(data.score.sellerScore)} showChevron={false} />
            <CanonicalMenuRow
              title="Business"
              value={String(data.score.businessScore)}
              showChevron={false}
            />
          </CanonicalCard>
        </CanonicalSection>

        {data.recommendations.length > 0 ? (
          <CanonicalSection title="Improve">
            <CanonicalCard variant="list">
              {data.recommendations.slice(0, 4).map((item) => (
                <CanonicalMenuRow key={item} title={item} showChevron={false} />
              ))}
            </CanonicalCard>
          </CanonicalSection>
        ) : null}

        <CanonicalSection title="Trust Centre">
          <CanonicalCard variant="list">
            {TRUST_CENTER_SECTIONS.filter((section) => section.id !== "score").map((section) => (
              <CanonicalMenuRow
                key={section.id}
                href={section.href}
                title={section.title}
                description={section.description}
              />
            ))}
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Verification">
          <TrustVerificationActions verifications={data.verifications} />
        </CanonicalSection>

        <CanonicalSection title="Recent">
          <CanonicalCard variant="list">
            {data.recentEvents.length ? (
              data.recentEvents.slice(0, 8).map((event) => (
                <CanonicalMenuRow
                  key={event.id}
                  title={event.reason ?? event.eventType.replace(/_/g, " ")}
                  value={event.delta >= 0 ? `+${event.delta}` : String(event.delta)}
                  showChevron={false}
                />
              ))
            ) : (
              <CanonicalMenuRow title="No trust events yet" showChevron={false} />
            )}
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
