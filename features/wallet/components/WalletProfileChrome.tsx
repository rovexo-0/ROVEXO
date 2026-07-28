"use client";

/**
 * Wallet Profile inheritance chrome — icons + Help from Profile Icon System v1.0.
 * Size 24px · stroke line icons · Profile colour tokens where applicable.
 */

import Link from "next/link";
import { ProfileMenuIcon } from "@/features/account-center/components/ProfileMenuIcons";
import {
  BankLineIcon,
  CreditCardLineIcon,
  DocumentLineIcon,
  LockLineIcon,
  PoundLineIcon,
  ShieldLineIcon,
  TruckLineIcon,
  UserLineIcon,
} from "@/components/icons/RvxLineIcons";
import { PROFILE_ICON_COLORS, PROFILE_ICON_SIZE_PX } from "@/lib/account-center/profile-icon-system-v1";

const iconStyle = (color: string) =>
  ({
    width: PROFILE_ICON_SIZE_PX,
    height: PROFILE_ICON_SIZE_PX,
    color,
    display: "block",
  }) as const;

export function WalletHelpHeaderAction() {
  return (
    <Link href="/help" className="wallet-profile-help" aria-label="Help" data-wallet-help="profile-ssot">
      <ProfileMenuIcon id="help" />
    </Link>
  );
}

export function WalletTransactionsIcon() {
  return <DocumentLineIcon style={iconStyle("#1a1a1a")} />;
}

export function WalletPaymentMethodsIcon() {
  return <CreditCardLineIcon style={iconStyle(PROFILE_ICON_COLORS.settings)} />;
}

export function WalletBankAccountsIcon() {
  return <BankLineIcon style={iconStyle(PROFILE_ICON_COLORS.balance)} />;
}

export function WalletPendingIcon() {
  return <TruckLineIcon style={iconStyle(PROFILE_ICON_COLORS["my-orders"])} />;
}

export function WalletProcessingIcon() {
  return <PoundLineIcon style={iconStyle(PROFILE_ICON_COLORS.settings)} />;
}

export function WalletLockedIcon() {
  return <LockLineIcon style={iconStyle(PROFILE_ICON_COLORS.logout)} />;
}

export function WalletCardIcon() {
  return <CreditCardLineIcon style={iconStyle(PROFILE_ICON_COLORS.settings)} />;
}

export function WalletPersonalAccountIcon() {
  return <UserLineIcon style={iconStyle("#1a1a1a")} />;
}

export function WalletBusinessAccountIcon() {
  return <BankLineIcon style={iconStyle(PROFILE_ICON_COLORS.balance)} />;
}

export function WalletSecurityIcon() {
  return <ShieldLineIcon style={iconStyle(PROFILE_ICON_COLORS.legal)} />;
}
