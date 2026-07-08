import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { Card } from "@/components/ui/Card";
import { getHelpHubQuickTiles } from "@/lib/mobile-ui/hubs";

export function HelpTextCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card padding="md" interactive className="h-full">
        <div className="flex items-start justify-between gap-ds-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-primary">{title}</p>
            <p className="mt-ds-1 text-sm text-text-secondary">{description}</p>
          </div>
          <ChevronRightLineIcon className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />
        </div>
      </Card>
    </Link>
  );
}

export function HelpQuickLinks() {
  return (
    <section aria-label="Support hubs" className="mhub-section">
      <h2 className="mhub-section__title">Support hubs</h2>
      <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
        {getHelpHubQuickTiles().map((tile) => (
          <HelpTextCard key={tile.href + tile.label} href={tile.href} title={tile.label} description={tile.subtitle} />
        ))}
      </div>
    </section>
  );
}
