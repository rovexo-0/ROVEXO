import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getNavigationSections } from "@/lib/navigation/map";
import type { UserProfile } from "@/lib/profile/types";

type NavigationHubProps = {
  profile: UserProfile;
};

export function NavigationHub({ profile }: NavigationHubProps) {
  const sections = getNavigationSections(profile).filter((section) => section.id !== "shared");

  return (
    <div className="space-y-ds-5">
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`nav-hub-${section.id}`}>
          <h2 id={`nav-hub-${section.id}`} className="text-base font-semibold text-text-primary">
            {section.title}
          </h2>
          <div className="mt-ds-3 grid grid-cols-2 gap-ds-2 sm:grid-cols-3">
            {section.links.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card padding="sm" interactive className="h-full min-h-[72px] shadow-ds-soft">
                  <p className="text-sm font-semibold text-text-primary">{link.label}</p>
                  {link.subtitle ? (
                    <p className="mt-ds-0.5 line-clamp-2 text-xs text-text-secondary">{link.subtitle}</p>
                  ) : null}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
