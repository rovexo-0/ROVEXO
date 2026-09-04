"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalInfoBlock } from "@/src/components/canonical";
import Link from "next/link";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { useRefreshHelpOnSellerContextChange } from "@/features/help/hooks/use-refresh-help-on-seller-context-change";
import { getHelpArticleForAudience } from "@/lib/help/content/articles";
import type { HelpCategoryHub } from "@/lib/help/content/category-hubs-v1";
import { HELP_AUDIENCES_FOR_GUEST, type HelpContentAudience } from "@/lib/help/help-content-audience-v1";
import { renderMarkdown } from "@/lib/help/markdown";

type HelpCategoryHubPageProps = {
  hub: HelpCategoryHub;
  allowedAudiences?: readonly HelpContentAudience[];
};

/** Long-form category handbook — reuses Help article shell (no UI redesign). */
export function HelpCategoryHubPage({
  hub,
  allowedAudiences = HELP_AUDIENCES_FOR_GUEST,
}: HelpCategoryHubPageProps) {
  useRefreshHelpOnSellerContextChange();
  const relatedHelp = hub.relatedHelp.filter((item) => {
    const slug = item.href.replace("/help/", "");
    if (!item.href.startsWith("/help/") || item.href.startsWith("/help/category/")) {
      return true;
    }
    return Boolean(getHelpArticleForAudience(slug, allowedAudiences));
  });
  return (
    <AccountCanonicalShell title={hub.title} backHref="/help" backLabel="Help Centre" showHeaderTitle>
      <nav aria-label="Breadcrumb" className="cds-section__intro">
        <Link href="/help" className="font-medium text-primary hover:opacity-80">
          Help Centre
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{hub.title}</span>
      </nav>
      <CanonicalInfoBlock variant="description">{hub.summary}</CanonicalInfoBlock>

      <CanonicalCard variant="medium">
        <div className="flex flex-col gap-ds-5 p-ds-4">
          <div
            className="prose-help cds-menu-row__subtitle"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(hub.content) }}
          />
        </div>
      </CanonicalCard>

      <CanonicalSection title="Related platform features">
        <CanonicalCard variant="list">
          {hub.relatedFeatures.map((item) => (
            <CanonicalMenuRow key={item.href} title={item.title} href={item.href} />
          ))}
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Related Help Articles">
        <CanonicalCard variant="list">
          {relatedHelp.map((item) => (
            <CanonicalMenuRow key={item.href} title={item.title} href={item.href} />
          ))}
          <CanonicalMenuRow title="Help Centre" description="Browse all categories" href="/help" />
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Related Legal Documents">
        <CanonicalCard variant="list">
          {hub.relatedLegal.map((item) => (
            <CanonicalMenuRow key={item.href} title={item.title} href={item.href} />
          ))}
          <CanonicalMenuRow title="Legal Centre" description="Official ROVEXO Legal Centre" href="/legal" />
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Need more help?">
        <CanonicalCard variant="list">
          <CanonicalMenuRow title="Contact Support" description="Open a support request via Help Centre" href="/support" />
          <CanonicalMenuRow title="Help Centre" description="Browse all guides" href="/help" />
          <CanonicalMenuRow title="Settings" description="Account control centre" href="/account/settings" />
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
