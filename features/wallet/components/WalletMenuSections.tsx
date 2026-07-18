"use client";

import { AccountIcon } from "@/components/account/AccountIcons";
import {
  buildBusinessWalletMenuSections,
  buildPersonalWalletMenuSections,
  type WalletMenuItem,
} from "@/lib/account-center/wallet-menus";
import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { useTranslation } from "@/lib/i18n/use-translation";

function WalletMenuNav({
  items,
  label,
  prefix,
}: {
  items: WalletMenuItem[];
  label: string;
  prefix: string;
}) {
  return (
    <nav className="ac-canonical__menu" aria-label={label}>
      <div className="cds-section">
        <CanonicalCard variant="list">
          {items.map((item) => (
            <CanonicalMenuRow
              key={item.id}
              id={`${prefix}-${item.id}`}
              href={item.href}
              title={item.title}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name={item.icon} />
                </span>
              }
            />
          ))}
        </CanonicalCard>
      </div>
    </nav>
  );
}

export function PersonalWalletMenuSections() {
  const { tx } = useTranslation();
  const items = buildPersonalWalletMenuSections().flatMap((section) => section.items);
  return <WalletMenuNav items={items} label={tx("Personal Wallet")} prefix="personal-wallet" />;
}

export function BusinessWalletMenuSections() {
  const { tx } = useTranslation();
  const items = buildBusinessWalletMenuSections().flatMap((section) => section.items);
  return <WalletMenuNav items={items} label={tx("Business Wallet")} prefix="business-wallet" />;
}
