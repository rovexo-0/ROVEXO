"use client";

import type { ReactNode } from "react";
import { MobileHubCard } from "@/features/mobile-ui/components/MobileHubCard";
import {
  MobileHubGrid,
  MobileHubBlock,
} from "@/features/mobile-ui/components/MobileHubPrimitives";
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
          <MobileHubBlock key={section.id} id={`mhub-${section.id}`} title={section.title}>
            <MobileHubGrid>
              {section.tiles.map((tile) => (
                <MobileHubCard
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
            </MobileHubGrid>
          </MobileHubBlock>
        ) : null,
      )}
    </div>
  );
}
