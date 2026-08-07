import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalInfoBlock } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { renderMarkdown } from "@/lib/help/markdown";
import type { HelpCategoryHub } from "@/lib/help/content/category-hubs-v1";

type HelpCategoryHubPageProps = {
  hub: HelpCategoryHub;
};

/** Long-form category handbook — reuses Help article shell (no UI redesign). */
export function HelpCategoryHubPage({ hub }: HelpCategoryHubPageProps) {
  return (
    <AccountCanonicalShell title={hub.title} backHref="/help" backLabel="Help Centre" showHeaderTitle>
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
          {hub.relatedHelp.map((item) => (
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
