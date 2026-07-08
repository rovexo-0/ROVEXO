"use client";

import { resolveDashboardIconType } from "@/lib/icons/resolve-dashboard-icon-type";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import type { HelpTopicSlug } from "@/lib/help/types";
import { resolveHelpTopicIcon } from "@/lib/icons/help-topic-icons";
import { RovexoIcons } from "@/lib/icons/icons";
import { resolveDashboardGlassIcon } from "@/lib/icons/resolve";
import { resolveTrustSectionIcon } from "@/lib/icons/trust-section-icons";
import type { RovexoIconRef } from "@/lib/icons/types";
import { cn } from "@/lib/cn";

type HubSectionIconProps = {
  icon?: RovexoIconRef;
  href?: string;
  helpTopicSlug?: HelpTopicSlug;
  trustSectionId?: string;
  className?: string;
  size?: number;
};

/** Icon for hub section cards (help, trust, business, etc.). */
export function HubSectionIcon({
  icon,
  href,
  helpTopicSlug,
  trustSectionId,
  className,
  size = 28,
}: HubSectionIconProps) {
  const resolved =
    icon ??
    (helpTopicSlug ? resolveHelpTopicIcon(helpTopicSlug) : undefined) ??
    (trustSectionId ? resolveTrustSectionIcon(trustSectionId) : undefined) ??
    (href ? resolveDashboardGlassIcon(resolveDashboardIconType(href)) : RovexoIcons.misc.help);

  return <RovexoIcon icon={resolved} size={size} className={cn("shrink-0", className)} />;
}
