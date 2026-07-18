"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalInfoBlock, CanonicalInput } from "@/src/components/canonical";
import { useMemo, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { HelpQuickLinks } from "@/features/help/components/HelpQuickLinks";
import { listHelpFaqs, searchHelpFaqs } from "@/lib/help/faq";

export function HelpFaqPage() {
  const [query, setQuery] = useState("");
  const faqs = useMemo(() => (query.trim() ? searchHelpFaqs(query) : listHelpFaqs()), [query]);

  return (
    <AccountCanonicalShell title="FAQ" backHref="/help" backLabel="Help Centre" showHeaderTitle>
      <CanonicalInfoBlock variant="description">
        Answers from official articles and guided troubleshooting flows.
      </CanonicalInfoBlock>

      <CanonicalSection title="Search">
        <CanonicalInput
          id="faq-search"
          inputType="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search FAQs..."
        />
      </CanonicalSection>

      <HelpQuickLinks />

      <CanonicalSection title="Frequently asked questions">
        <CanonicalCard variant="list">
          {faqs.map((faq) => (
            <CanonicalMenuRow
              key={faq.id}
              href={faq.href}
              title={faq.question}
              description={faq.answer}
            />
          ))}
          {!faqs.length ? (
            <CanonicalMenuRow title="No FAQs matched your search." showChevron={false} />
          ) : null}
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
