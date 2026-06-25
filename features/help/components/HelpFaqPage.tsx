"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { HelpMobileNav } from "@/features/help/components/HelpMobileNav";
import { ResponsiveShell } from "@/features/mobile-ui";
import { listHelpFaqs, searchHelpFaqs } from "@/lib/help/faq";

export function HelpFaqPage() {
  const [query, setQuery] = useState("");
  const faqs = useMemo(() => (query.trim() ? searchHelpFaqs(query) : listHelpFaqs()), [query]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-ds-6 px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
      <div>
        <Link href="/help" className="text-sm font-medium text-primary hover:underline">
          ← Help Centre
        </Link>
        <h1 className="mt-ds-3 text-2xl font-bold text-text-primary">Frequently Asked Questions</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Answers from official articles and guided troubleshooting flows.
        </p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search FAQs..."
          className="mt-ds-4 w-full premium-input rounded-ds-xl px-ds-4 py-ds-3 text-sm"
        />
      </div>

      <ResponsiveShell mobile={<HelpMobileNav />} desktop={null} />

      <div className="space-y-ds-3">
        {faqs.map((faq) => (
          <Card key={faq.id} padding="md" className="">
            <p className="font-semibold text-text-primary">{faq.question}</p>
            <p className="mt-ds-2 text-sm text-text-secondary">{faq.answer}</p>
            <Link href={faq.href} className="mt-ds-3 inline-flex text-sm font-medium text-primary hover:underline">
              View full guidance
            </Link>
          </Card>
        ))}
        {!faqs.length ? (
          <Card padding="md" className="">
            <p className="text-sm text-text-secondary">No FAQs matched your search.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
