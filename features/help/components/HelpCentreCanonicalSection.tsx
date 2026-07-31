import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { MasterMenuIcon } from "@/features/account-center/components/MasterMenuIcon";
import { HELP_CENTRE_CATEGORY_BUTTONS } from "@/lib/help/help-centre-categories";
import { resolveHelpCategoryIcon } from "@/lib/help/help-centre-icons-v1";

export function HelpCentreCategoryGrid() {
  return (
    <CanonicalSection title="Help Centre">
      <CanonicalCard variant="list" data-help-centre-version="v1.0-legal-lock">
        {HELP_CENTRE_CATEGORY_BUTTONS.map((item) => (
          <HelpTextCard
            key={`${item.href}-${item.title}`}
            href={item.href}
            title={item.title}
            description={item.description}
          />
        ))}
      </CanonicalCard>
    </CanonicalSection>
  );
}

/** @deprecated Use HelpCentreCategoryGrid */
export const HelpCentreCanonicalSection = HelpCentreCategoryGrid;

export function HelpTextCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  const { icon, color } = resolveHelpCategoryIcon(title);
  return (
    <CanonicalMenuRow
      href={href}
      title={title}
      description={description}
      icon={<MasterMenuIcon icon={icon} color={color} />}
    />
  );
}
