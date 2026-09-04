"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalInfoBlock } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { MasterMenuIcon } from "@/features/account-center/components/MasterMenuIcon";
import { MASTER_ICON_COLORS } from "@/lib/design-system/master-icon-system-v1";

import { useRefreshHelpOnSellerContextChange } from "@/features/help/hooks/use-refresh-help-on-seller-context-change";
import type { HelpPolicyEntry } from "@/lib/help/policies";

type HelpPoliciesPageProps = {
  policies: HelpPolicyEntry[];
};

export function HelpPoliciesPage({ policies }: HelpPoliciesPageProps) {
  useRefreshHelpOnSellerContextChange();
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
              icon={<MasterMenuIcon icon="legal" color={MASTER_ICON_COLORS.blue} />}
            />
          ))}
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
