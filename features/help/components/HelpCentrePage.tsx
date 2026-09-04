"use client";

import { CanonicalSection, CanonicalMenuRow, CanonicalInfoBlock, CanonicalInput } from "@/src/components/canonical";
import { useMemo, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { MasterMenuIcon } from "@/features/account-center/components/MasterMenuIcon";

import { HelpCentreCategoryGrid } from "@/features/help/components/HelpCentreCanonicalSection";
import { useRefreshHelpOnSellerContextChange } from "@/features/help/hooks/use-refresh-help-on-seller-context-change";
import { HELP_CENTRE_SUPPORT_ICONS } from "@/lib/help/help-centre-icons-v1";
import {
  canAccessHelpContent,
  HELP_AUDIENCES_FOR_GUEST,
  type HelpContentAudience,
} from "@/lib/help/help-content-audience-v1";
import { searchHelpCentre } from "@/lib/help/search";
import type { HelpSearchResult } from "@/lib/help/types";

type HelpCentrePageProps = {
  initialQuery?: string;
  allowedAudiences?: readonly HelpContentAudience[];
};

export function HelpCentrePage({
  initialQuery = "",
  allowedAudiences = HELP_AUDIENCES_FOR_GUEST,
}: HelpCentrePageProps) {
  useRefreshHelpOnSellerContextChange();
  const [query, setQuery] = useState(initialQuery);
  const showBusinessStore = canAccessHelpContent("business", allowedAudiences);
  const results = useMemo(
    () => searchHelpCentre(query, 16, { allowedAudiences }),
    [query, allowedAudiences],
  );
  const hasQuery = query.trim().length > 0;

  return (
    <AccountCanonicalShell title="Help Centre" backHref="/account/settings" backLabel="Settings" showHeaderTitle>
      <div className="fw-engine__stack" data-full-width-surface="help-centre">
        <CanonicalSection title="Search">
          <div className="fw-engine__group flex flex-col gap-ds-3">
            <CanonicalInfoBlock variant="description">
              Search guides or choose a category below.
            </CanonicalInfoBlock>
            <CanonicalInput
              id="help-search"
              inputType="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles, categories, FAQs..."
              aria-label="Search help"
            />
          </div>
        </CanonicalSection>

        {hasQuery ? (
          <HelpSearchResults results={results} query={query} />
        ) : (
          <>
            <HelpCentreCategoryGrid />
            {showBusinessStore ? (
              <CanonicalSection title="Business">
                <div className="fw-engine__group">
                  <CanonicalMenuRow
                    title="Business storefront"
                    description="Present your public store using Business tools"
                    icon={
                      <MasterMenuIcon
                        icon={HELP_CENTRE_SUPPORT_ICONS.businessStore.icon}
                        color={HELP_CENTRE_SUPPORT_ICONS.businessStore.color}
                      />
                    }
                    href="/help/business-storefront-tips"
                  />
                </div>
              </CanonicalSection>
            ) : null}
            <CanonicalSection title="Need support?">
              <div className="fw-engine__group">
                <CanonicalMenuRow
                  title="Contact Support"
                  description="Submit a support request"
                  icon={
                    <MasterMenuIcon
                      icon={HELP_CENTRE_SUPPORT_ICONS.contactSupport.icon}
                      color={HELP_CENTRE_SUPPORT_ICONS.contactSupport.color}
                    />
                  }
                  href="/support"
                />
                <CanonicalMenuRow
                  title="Report a Problem"
                  description="Report a user or listing issue"
                  icon={
                    <MasterMenuIcon
                      icon={HELP_CENTRE_SUPPORT_ICONS.reportProblem.icon}
                      color={HELP_CENTRE_SUPPORT_ICONS.reportProblem.color}
                    />
                  }
                  href="/support?category=report_user"
                />
                <CanonicalMenuRow
                  title="FAQ"
                  description="Short answers from official Help"
                  icon={
                    <MasterMenuIcon
                      icon={HELP_CENTRE_SUPPORT_ICONS.faq.icon}
                      color={HELP_CENTRE_SUPPORT_ICONS.faq.color}
                    />
                  }
                  href="/help/faq"
                />
                <CanonicalMenuRow
                  title="Privacy Policy"
                  description="How ROVEXO uses personal data"
                  icon={
                    <MasterMenuIcon
                      icon={HELP_CENTRE_SUPPORT_ICONS.privacyPolicy.icon}
                      color={HELP_CENTRE_SUPPORT_ICONS.privacyPolicy.color}
                    />
                  }
                  href="/legal/privacy-policy"
                />
                <CanonicalMenuRow
                  title="Privacy Settings"
                  description="Manage privacy controls on your account"
                  icon={
                    <MasterMenuIcon
                      icon={HELP_CENTRE_SUPPORT_ICONS.privacySettings.icon}
                      color={HELP_CENTRE_SUPPORT_ICONS.privacySettings.color}
                    />
                  }
                  href="/account/privacy"
                />
                <CanonicalMenuRow
                  title="Legal Centre"
                  description="Official ROVEXO Legal Centre"
                  icon={
                    <MasterMenuIcon
                      icon={HELP_CENTRE_SUPPORT_ICONS.legalCentre.icon}
                      color={HELP_CENTRE_SUPPORT_ICONS.legalCentre.color}
                    />
                  }
                  href="/legal"
                />
                <CanonicalMenuRow
                  title="About ROVEXO"
                  description="How the marketplace works"
                  icon={
                    <MasterMenuIcon
                      icon={HELP_CENTRE_SUPPORT_ICONS.about.icon}
                      color={HELP_CENTRE_SUPPORT_ICONS.about.color}
                    />
                  }
                  href="/about"
                />
              </div>
            </CanonicalSection>
          </>
        )}
      </div>
    </AccountCanonicalShell>
  );
}

function HelpSearchResults({ results, query }: { results: HelpSearchResult[]; query: string }) {
  return (
    <CanonicalSection title="Search results">
      <p className="cds-section__intro">
        {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
      </p>
      <div className="fw-engine__group">
        {results.map((result) => (
          <CanonicalMenuRow
            key={`${result.type}:${result.id}`}
            href={result.href}
            title={result.title}
            description={result.excerpt}
          />
        ))}
      </div>
      {results.length === 0 ? (
        <>
          <CanonicalInfoBlock variant="description">
            No matches found. Browse a category or contact Support.
          </CanonicalInfoBlock>
          <HelpCentreCategoryGrid />
        </>
      ) : null}
    </CanonicalSection>
  );
}
