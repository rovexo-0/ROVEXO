"use client";

import { useMemo, useState, type ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { MobilePremiumCard } from "@/features/mobile-ui/components/MobilePremiumCard";
import { MobilePrimaryHubFolder } from "@/features/mobile-ui/components/MobilePrimaryHubFolder";
import {
  MobilePremiumGrid,
  MobilePremiumSection,
} from "@/features/mobile-ui/components/MobilePremiumPrimitives";
import {
  resolveMobileBadge,
  useMobileBadges,
} from "@/features/mobile-ui/hooks/use-mobile-badges";
import { getHubBadgeCount } from "@/lib/mobile-ui/hub-badges";
import { getMobilePrimaryHubs } from "@/lib/mobile-ui/hubs";
import { getNavLinkIcon } from "@/lib/navigation/link-icons";
import type {
  MobileBadges,
  MobileHubContext,
  MobilePrimaryHubId,
} from "@/lib/mobile-ui/types";
import type { UserProfile } from "@/lib/profile/types";
import { BackIcon } from "@/features/notifications/icons";

type MobilePrimaryHubsProps = {
  profile: UserProfile;
  defaultHub?: MobilePrimaryHubId;
  startExpanded?: boolean;
  badges?: MobileBadges;
  badgeSeed?: Partial<MobileBadges> & { isSeller?: boolean };
  context?: MobileHubContext;
  header?: ReactNode;
  footer?: ReactNode;
  sectionTitle?: string;
};

export function MobilePrimaryHubs({
  profile,
  defaultHub,
  startExpanded = false,
  badges: badgesProp,
  badgeSeed,
  context,
  header,
  footer,
  sectionTitle = "Navigation",
}: MobilePrimaryHubsProps) {
  const hubs = useMemo(() => getMobilePrimaryHubs(profile, context), [profile, context]);
  const polled = useMobileBadges(badgeSeed);
  const badges = badgesProp ?? polled;

  const [activeHub, setActiveHub] = useState<MobilePrimaryHubId | null>(() => {
    if (startExpanded && defaultHub) return defaultHub;
    return null;
  });

  const openHub = hubs.find((hub) => hub.id === activeHub) ?? null;

  if (openHub) {
    return (
      <section className="mhub-section" aria-labelledby="mhub-open-hub-heading">
        <div className="flex items-center gap-ds-2">
          <IconButton
            label="Back to navigation hubs"
            variant="ghost"
            size="md"
            onClick={() => setActiveHub(null)}
          >
            <BackIcon className="h-5 w-5" />
          </IconButton>
          <h2 id="mhub-open-hub-heading" className="mhub-section__title min-w-0 flex-1 truncate">
            {openHub.label}
          </h2>
        </div>
        <p className="text-sm text-text-secondary">{openHub.subtitle}</p>

        <MobilePremiumGrid className="mt-ds-2">
          {openHub.tiles.map((tile) => (
            <MobilePremiumCard
              key={`${openHub.id}-${tile.href}-${tile.label}`}
              href={tile.href}
              label={tile.label}
              subtitle={tile.subtitle}
              icon={getNavLinkIcon(tile.href)}
              badgeKey={tile.badge}
              badgeCount={resolveMobileBadge(tile.badge, badges, tile.badgeCount)}
              badgeTone={tile.badgeTone}
            />
          ))}
        </MobilePremiumGrid>

        {footer}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-ds-4">
      {header}
      <MobilePremiumSection id="mhub-primary" title={sectionTitle}>
        <MobilePremiumGrid>
          {hubs.map((hub) => (
            <MobilePrimaryHubFolder
              key={hub.id}
              hub={hub}
              badgeCount={getHubBadgeCount(hub.id, hub.tiles, badges)}
              onOpen={() => setActiveHub(hub.id)}
            />
          ))}
        </MobilePremiumGrid>
      </MobilePremiumSection>
      {footer}
    </div>
  );
}
