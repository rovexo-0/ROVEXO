
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { HELP_CENTRE_CATEGORY_BUTTONS } from "@/lib/help/help-centre-categories";
import type { ReactNode } from "react";
import {
  BagLineIcon,
  CreditCardLineIcon,
  DocumentLineIcon,
  ShieldLineIcon,
  TagLineIcon,
  TruckLineIcon,
  UserLineIcon,
} from "@/components/icons/RvxLineIcons";

const CATEGORY_ICONS: Record<string, ReactNode> = {
  Buying: <BagLineIcon />,
  Selling: <TagLineIcon />,
  "Payments & Wallet": <CreditCardLineIcon />,
  Shipping: <TruckLineIcon />,
  Orders: <DocumentLineIcon />,
  Account: <UserLineIcon />,
  Safety: <ShieldLineIcon />,
  "Reports & Appeals": <DocumentLineIcon />,
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
  return (
    <CanonicalMenuRow
      href={href}
      title={title}
      description={description}
      icon={CATEGORY_ICONS[title] ?? <DocumentLineIcon />}
    />
  );
}
