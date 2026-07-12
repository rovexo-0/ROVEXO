"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalInfoBlock, CanonicalInput } from "@/src/components/canonical";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { HelpQuickLinks } from "@/features/help/components/HelpQuickLinks";
import { listHelpFaqs, searchHelpFaqs } from "@/lib/help/faq";

export function HelpFaqPage() {
  const [query, setQuery] = useState("");
  const faqs = useMemo(() => (query.trim() ? searchHelpFaqs(query) : listHelpFaqs()), [query]);

  return (
    <AccountCanonicalShell title="FAQ" backHref="/help" backLabel="Help Centre">
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
            <div key={faq.id} className="border-b border-[var(--cds-color-divider)] px-[var(--cds-row-padding-x)] py-ds-4 last:border-b-0">
              <p className="cds-menu-row__title">{faq.question}</p>
              <p className="cds-menu-row__subtitle mt-ds-2">{faq.answer}</p>
              <Link href={faq.href} className="cds-menu-row__title mt-ds-3 inline-flex text-primary hover:opacity-80">
                View full guidance
              </Link>
            </div>
          ))}
          {!faqs.length ? (
            <CanonicalInfoBlock variant="description">No FAQs matched your search.</CanonicalInfoBlock>
          ) : null}
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
