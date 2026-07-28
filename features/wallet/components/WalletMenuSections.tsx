"use client";

import {
  buildBusinessWalletMenuSections,
  buildPersonalWalletMenuSections,
  type WalletMenuItem,
} from "@/lib/account-center/wallet-menus";
import { ProfileBalanceMenuIcon } from "@/features/wallet/components/ProfileBalanceMenuIcon";
import { CanonicalMenuRow } from "@/src/components/canonical";
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
    <nav
      className="ac-canonical__menu fw-engine__stack"
      aria-label={label}
      data-balance-icons="profile-ssot"
      data-full-width-surface="wallet"
    >
      <div className="fw-engine__group">
        {items.map((item) => (
          <CanonicalMenuRow
            key={item.id}
            id={`${prefix}-${item.id}`}
            href={item.href}
            title={item.title}
            icon={<ProfileBalanceMenuIcon />}
          />
        ))}
      </div>
    </nav>
  );
}

export function PersonalWalletMenuSections({
  isBusinessVerified = false,
}: {
  isBusinessVerified?: boolean;
}) {
  void isBusinessVerified;
  const { tx } = useTranslation();
  const items = buildPersonalWalletMenuSections().flatMap((section) => section.items);
  return <WalletMenuNav items={items} label={tx("Personal Wallet")} prefix="personal-wallet" />;
}

export function BusinessWalletMenuSections({
  isBusinessVerified = false,
}: {
  isBusinessVerified?: boolean;
}) {
  void isBusinessVerified;
  const { tx } = useTranslation();
  const items = buildBusinessWalletMenuSections().flatMap((section) => section.items);
  return <WalletMenuNav items={items} label={tx("Business Wallet")} prefix="business-wallet" />;
}
