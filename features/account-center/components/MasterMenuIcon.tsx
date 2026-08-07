/**
 * Master Menu Icon — Profile Icon System density on Account line glyphs.
 * Size 24 · stroke 1.9 · colour via currentColor · no emoji · no grey.
 */

import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import { cn } from "@/lib/cn";
import {
  MASTER_ICON_SIZE_PX,
  resolveCategoryMasterIcon,
  resolveSellFieldMasterIcon,
} from "@/lib/design-system/master-icon-system-v1";

type MasterMenuIconProps = {
  icon: AccountIconName;
  color: string;
  className?: string;
};

export function MasterMenuIcon({ icon, color, className }: MasterMenuIconProps) {
  return (
    <span
      className={cn("cds-menu-row__icon ac-canonical__menu-icon master-menu-icon", className)}
      style={{ color, width: MASTER_ICON_SIZE_PX, height: MASTER_ICON_SIZE_PX }}
      aria-hidden
      data-master-icon={icon}
    >
      <AccountIcon name={icon} className="master-menu-icon__glyph" />
    </span>
  );
}

export function CategoryMasterIcon({ slug, className }: { slug: string; className?: string }) {
  const resolved = resolveCategoryMasterIcon(slug);
  return <MasterMenuIcon icon={resolved.icon} color={resolved.color} className={className} />;
}

export function SellFieldMasterIcon({
  fieldId,
  className,
}: {
  fieldId: string;
  className?: string;
}) {
  const resolved = resolveSellFieldMasterIcon(fieldId);
  if (!resolved) return null;
  return <MasterMenuIcon icon={resolved.icon} color={resolved.color} className={className} />;
}
