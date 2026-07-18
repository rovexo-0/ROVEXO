"use client";

import { AccountIcon } from "@/components/account/AccountIcons";
import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalInfoBlock } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";

import type { HelpPolicyEntry } from "@/lib/help/policies";

type HelpPoliciesPageProps = {
  policies: HelpPolicyEntry[];
};

export function HelpPoliciesPage({ policies }: HelpPoliciesPageProps) {
  return (
    <AccountCanonicalShell title="Platform Policies" backHref="/help" backLabel="Help Centre" showHeaderTitle>
      <CanonicalInfoBlock variant="description">
        Terms, privacy, safety, prohibited items, and community guidelines.
      </CanonicalInfoBlock>

      <CanonicalSection title="Policies">
        <CanonicalCard variant="list">
          {policies.map((policy) => (
            <CanonicalMenuRow
              key={policy.slug}
              title={policy.title}
              description={policy.summary}
              href={policy.href}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="help" />
                </span>
              }
            />
          ))}
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
