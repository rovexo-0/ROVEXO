import Link from "next/link";
import type { InternalLinkGroup } from "@/lib/seo/internal-links";

type InternalLinksSectionProps = {
  groups: InternalLinkGroup[];
};

export function InternalLinksSection({ groups }: InternalLinksSectionProps) {
  const visible = groups.filter((group) => group.links.length > 0);
  if (!visible.length) return null;

  return (
    <section aria-labelledby="internal-links-heading" className="space-y-ds-5">
      <h2 id="internal-links-heading" className="text-lg font-semibold text-text-primary">
        Discover more
      </h2>
      {visible.map((group) => (
        <div key={group.title}>
          <h3 className="mb-ds-2 text-sm font-medium text-text-secondary">{group.title}</h3>
          <div className="flex flex-wrap gap-ds-2">
            {group.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full bg-surface-muted px-ds-3 py-ds-1 text-sm text-text-primary transition-colors hover:bg-surface-elevated"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
