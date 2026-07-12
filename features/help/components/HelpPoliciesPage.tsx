import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";

import type { HelpPolicyEntry } from "@/lib/help/policies";

type HelpPoliciesPageProps = {
  policies: HelpPolicyEntry[];
};

export function HelpPoliciesPage({ policies }: HelpPoliciesPageProps) {
  return (
    <AccountCanonicalShell title="Platform Policies" backHref="/help" backLabel="Help Centre">
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
            />
          ))}
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
