import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { HELP_CENTRE_CATEGORY_BUTTONS } from "@/lib/help/help-centre-categories";

/** One Product — same AccountIcon language as My Account. */
const CATEGORY_ICONS: Record<string, AccountIconName> = {
  Buying: "orders",
  Selling: "listings",
  "Payments & Wallet": "wallet",
  Shipping: "shipping",
  Orders: "orders",
  Account: "profile",
  Safety: "security",
  "Reports & Appeals": "support",
};

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
  const iconName = CATEGORY_ICONS[title] ?? "help";
  return (
    <CanonicalMenuRow
      href={href}
      title={title}
      description={description}
      icon={
        <span className="ac-canonical__menu-icon" aria-hidden>
          <AccountIcon name={iconName} />
        </span>
      }
    />
  );
}
