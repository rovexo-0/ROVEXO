"use client";



import Link from "next/link";

import { useMemo, useState } from "react";

import { PageBack } from "@/components/navigation/PageBack";
import { HelpAssistant } from "@/features/help/components/HelpAssistant";

import { HelpQuickLinks, HelpTextCard } from "@/features/help/components/HelpQuickLinks";

import { ResponsiveShell } from "@/features/mobile-ui";

import { HELP_TOPIC_GROUPS, getHelpTopicsByGroup } from "@/lib/help/content/topics";

import { searchHelpCentre } from "@/lib/help/search";

import type { HelpSearchResult } from "@/lib/help/types";

import { Card } from "@/components/ui/Card";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";



type HelpCentrePageProps = {

  initialQuery?: string;

};



export function HelpCentrePage({ initialQuery = "" }: HelpCentrePageProps) {

  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => searchHelpCentre(query), [query]);



  const hero = (

    <section className="mhub-hero lg:rounded-ds-xl lg:bg-gradient-to-br lg:from-primary/10 lg:via-surface lg:to-surface lg:p-ds-6">

      <p className="text-sm font-medium text-primary">ROVEXO Help Centre</p>

      <h1 className="mt-ds-2 text-2xl font-bold text-text-primary lg:text-3xl">

        How can we help?

      </h1>

      <p className="mt-ds-2 text-base text-text-secondary">Search guides, FAQs, and policies.</p>

      <label className="sr-only" htmlFor="help-search">

        Search help

      </label>

      <input

        id="help-search"

        value={query}

        onChange={(event) => setQuery(event.target.value)}

        placeholder="Search articles, categories, FAQs..."

        className="mt-ds-4 w-full rx-input rounded-ds-xl px-ds-4 py-ds-3 text-sm lg:mt-ds-5 lg:py-ds-4"

      />

    </section>

  );



  return (

    <div className="mx-auto flex w-full max-w-5xl flex-col gap-ds-6 px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">

      <PageBack backHref="/account" backLabel="My Account" preferHistory />

      {hero}

      <HelpAssistant compact />



      <ResponsiveShell

        mobile={

          !query.trim() ? (

            <>

              <HelpQuickLinks />

              <MobileBrowseTopics />

            </>

          ) : (

            <MobileSearchResults results={results} query={query} />

          )

        }

        desktop={

          <>

            {!query.trim() ? <HelpQuickLinks /> : null}

            {query.trim() ? <DesktopSearchResults results={results} query={query} /> : <DesktopBrowseTopics />}

          </>

        }

      />

    </div>

  );

}



function MobileSearchResults({ results, query }: { results: HelpSearchResult[]; query: string }) {

  return (

    <section aria-label="Search results" className="mhub-section">

      <h2 className="mhub-section__title">Search results</h2>

      <p className="text-sm text-text-secondary">

        {results.length} result{results.length === 1 ? "" : "s"} for “{query}”

      </p>

      <div className="mt-ds-3 grid gap-ds-3">

        {results.map((result) => (

          <HelpTextCard

            key={`${result.type}:${result.id}`}

            href={result.href}

            title={result.title}

            description={result.excerpt}

          />

        ))}

      </div>

    </section>

  );

}



function MobileBrowseTopics() {

  return (

    <section aria-labelledby="mobile-browse-topics-heading" className="mhub-section">

      <h2 id="mobile-browse-topics-heading" className="mhub-section__title">

        Browse Help Topics

      </h2>

      <div className="flex flex-col gap-ds-5">

        {HELP_TOPIC_GROUPS.map((group) => {

          const topics = getHelpTopicsByGroup(group);

          if (!topics.length) return null;

          return (

            <div key={group}>

              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{group}</h3>

              <div className="mt-ds-3 grid gap-ds-3">

                {topics.map((topic) => (

                  <HelpTextCard

                    key={topic.slug}

                    href={`/help/category/${topic.slug}`}

                    title={topic.label}

                    description={topic.description}

                  />

                ))}

              </div>

            </div>

          );

        })}

      </div>

    </section>

  );

}



function DesktopSearchResults({ results, query }: { results: HelpSearchResult[]; query: string }) {

  return (

    <section aria-label="Search results">

      <h2 className="text-lg font-semibold text-text-primary">Search results</h2>

      <p className="mt-ds-1 text-sm text-text-secondary">

        {results.length} result{results.length === 1 ? "" : "s"} for “{query}”

      </p>

      <div className="mt-ds-4 grid gap-ds-3">

        {results.map((result) => (

          <Link key={`${result.type}:${result.id}`} href={result.href}>

            <Card padding="md" interactive>

              <div className="flex items-start justify-between gap-ds-3">

                <div className="min-w-0 flex-1">

                  <div className="flex items-center gap-ds-2">

                    <p className="font-semibold text-text-primary">{result.title}</p>

                    <span className="rounded-full bg-surface-muted px-ds-2 py-ds-0.5 text-xs capitalize text-text-muted">

                      {result.type}

                    </span>

                  </div>

                  <p className="mt-ds-1 text-sm text-text-secondary">{result.excerpt}</p>

                </div>

                <ChevronRightLineIcon className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />

              </div>

            </Card>

          </Link>

        ))}

      </div>

    </section>

  );

}



function DesktopBrowseTopics() {

  return (

    <section aria-labelledby="browse-topics-heading">

      <h2 id="browse-topics-heading" className="text-lg font-semibold text-text-primary">

        Browse Help Topics

      </h2>

      <div className="mt-ds-5 space-y-ds-8">

        {HELP_TOPIC_GROUPS.map((group) => {

          const topics = getHelpTopicsByGroup(group);

          if (!topics.length) return null;

          return (

            <div key={group}>

              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{group}</h3>

              <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">

                {topics.map((topic) => (

                  <HelpTextCard

                    key={topic.slug}

                    href={`/help/category/${topic.slug}`}

                    title={topic.label}

                    description={topic.description}

                  />

                ))}

              </div>

            </div>

          );

        })}

      </div>

    </section>

  );

}


