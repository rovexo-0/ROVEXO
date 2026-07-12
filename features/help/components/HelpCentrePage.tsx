"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { useMemo, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";


import { HeadsetLineIcon, MailLineIcon } from "@/components/icons/RvxLineIcons";
import { HelpAssistant } from "@/features/help/components/HelpAssistant";
import { HelpCentreCategoryGrid } from "@/features/help/components/HelpCentreCanonicalSection";
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
    <AccountCanonicalShell title="Help Centre" backHref="/account">
      <CanonicalSection title="Search">
        <CanonicalCard variant="medium">
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
        </CanonicalCard>
      </CanonicalSection>

      {hasQuery ? (
        <HelpSearchResults results={results} query={query} />
      ) : (
        <>
          <HelpCentreCategoryGrid />
          <CanonicalSection title="Contact Support">
            <CanonicalCard variant="list">
              <CanonicalMenuRow
                title="Email"
                description="Submit a support request"
                icon={<MailLineIcon />}
                href="/support"
              />
              <CanonicalMenuRow
                title="Report Problem"
                description="Report an issue with an order or listing"
                icon={<HeadsetLineIcon />}
                href="/support?category=report"
              />
            </CanonicalCard>
          </CanonicalSection>
          <HelpAssistant compact />
        </>
      )}
    </AccountCanonicalShell>
  );
}

function HelpSearchResults({ results, query }: { results: HelpSearchResult[]; query: string }) {
  return (
    <CanonicalSection title="Search results">
      <p className="cds-section__intro">
        {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
      </p>
      <CanonicalCard variant="list">
        {results.map((result) => (
          <CanonicalMenuRow
            key={`${result.type}:${result.id}`}
            href={result.href}
            title={result.title}
            description={result.excerpt}
          />
        ))}
      </CanonicalCard>
      {results.length === 0 ? (
        <CanonicalInfoBlock variant="description">
          No matches found. Try a category below or contact support from a help article.
        </CanonicalInfoBlock>
      ) : null}
    </CanonicalSection>
  );
}
