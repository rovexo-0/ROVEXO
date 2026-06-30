"use client";

import type { ReactNode } from "react";
import { MobilePremiumCard } from "@/features/mobile-ui/components/MobilePremiumCard";
import {
  MobilePremiumGrid,
  MobilePremiumSection,
} from "@/features/mobile-ui/components/MobilePremiumPrimitives";
import {
  resolveMobileBadge,
  useMobileBadges,
} from "@/features/mobile-ui/hooks/use-mobile-badges";
import { resolveDashboardIconType } from "@/components/icons/DashboardIcon3D";
import type { MobileBadges, MobileHubSection } from "@/lib/mobile-ui/types";

type MobileHubSectionsProps = {
  sections: MobileHubSection[];
  badges?: MobileBadges;
  badgeSeed?: Partial<MobileBadges> & { isSeller?: boolean };
  header?: ReactNode;
};

export function MobileHubSections({
  sections,
  badges: badgesProp,
  badgeSeed,
  header,
}: MobileHubSectionsProps) {
  const polled = useMobileBadges(badgeSeed);
  const badges = badgesProp ?? polled;

  return (
    <div className="flex flex-col gap-ds-4">
      {header}
      {sections.map((section) =>
        section.tiles.length ? (
          <MobilePremiumSection key={section.id} id={`mhub-${section.id}`} title={section.title}>
            <MobilePremiumGrid>
              {section.tiles.map((tile) => (
                <MobilePremiumCard
                  key={`${section.id}-${tile.href}-${tile.label}`}
                  href={tile.href}
                  label={tile.label}
                  subtitle={tile.subtitle}
                  iconType={resolveDashboardIconType(tile.href)}
                  badgeKey={tile.badge}
                  badgeCount={resolveMobileBadge(tile.badge, badges, tile.badgeCount)}
                  badgeTone={tile.badgeTone}
                />
              ))}
            </MobilePremiumGrid>
          </MobilePremiumSection>
        ) : null,
      )}
    </div>
  );
}
