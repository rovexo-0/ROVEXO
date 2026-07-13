"use client";

import type { ReactNode } from "react";
import {
  BellLineIcon,
  CreditCardLineIcon,
  DocumentLineIcon,
  GlobeLineIcon,
  HeadsetLineIcon,
  InfoLineIcon,
  LocationLineIcon,
  LockLineIcon,
  LogoutLineIcon,
  MegaphoneLineIcon,
  MoonLineIcon,
  PeopleLineIcon,
  PhoneLineIcon,
  SettingsLineIcon,
  ShieldLineIcon,
  StarLineIcon,
  UserLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import type { SettingsMenuIcon } from "@/lib/account-center/settings-menu";

export function SettingsMenuIconGlyph({
  name,
  danger = false,
}: {
  name: SettingsMenuIcon;
  danger?: boolean;
}) {
  const className = danger ? "settings-canonical__danger-icon" : undefined;
  const icon = resolveSettingsMenuIcon(name);
  return (
    <span className="cds-menu-row__icon" aria-hidden>
      <span className={className}>{icon}</span>
    </span>
  );
}

function resolveSettingsMenuIcon(name: SettingsMenuIcon): ReactNode {
  switch (name) {
    case "user":
      return <UserLineIcon />;
    case "location":
      return <LocationLineIcon />;
    case "credit-card":
      return <CreditCardLineIcon />;
    case "bell":
      return <BellLineIcon />;
    case "lock":
      return <LockLineIcon />;
    case "people":
      return <PeopleLineIcon />;
    case "phone":
      return <PhoneLineIcon />;
    case "shield":
      return <ShieldLineIcon />;
    case "star":
      return <StarLineIcon />;
    case "megaphone":
      return <MegaphoneLineIcon />;
    case "wallet":
      return <WalletLineIcon />;
    case "settings":
      return <SettingsLineIcon />;
    case "moon":
      return <MoonLineIcon />;
    case "globe":
      return <GlobeLineIcon />;
    case "headset":
      return <HeadsetLineIcon />;
    case "document":
      return <DocumentLineIcon />;
    case "info":
      return <InfoLineIcon />;
    case "logout":
      return <LogoutLineIcon />;
    default:
      return <SettingsLineIcon />;
  }
}
