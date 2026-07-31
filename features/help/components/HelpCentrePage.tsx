"use client";

import { CanonicalSection, CanonicalMenuRow, CanonicalInfoBlock, CanonicalInput } from "@/src/components/canonical";
import { useMemo, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { MasterMenuIcon } from "@/features/account-center/components/MasterMenuIcon";

import { HelpCentreCategoryGrid } from "@/features/help/components/HelpCentreCanonicalSection";
import { HELP_CENTRE_SUPPORT_ICONS } from "@/lib/help/help-centre-icons-v1";
import { searchHelpCentre } from "@/lib/help/search";
import type { HelpSearchResult } from "@/lib/help/types";

type HelpCentrePageProps = {
  initialQuery?: string;
};

export function HelpCentrePage({ initialQuery = "" }: HelpCentrePageProps) {
  const [query, setQuery] = useState(initialQuery);
  const results = useMemo(() => searchHelpCentre(query), [query]);
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
            <CanonicalSection title="Need support?">
              <div className="fw-engine__group">
                <CanonicalMenuRow
                  title="Contact Support"
                  description="Submit a support request (Help Centre entry point)"
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
                  description="Report an issue with an order or listing"
                  icon={
                    <MasterMenuIcon
                      icon={HELP_CENTRE_SUPPORT_ICONS.reportProblem.icon}
                      color={HELP_CENTRE_SUPPORT_ICONS.reportProblem.color}
                    />
                  }
                  href="/support?category=report"
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
        <CanonicalInfoBlock variant="description">
          No matches found. Try a category below or contact support from a help article.
        </CanonicalInfoBlock>
      ) : null}
    </CanonicalSection>
  );
}
