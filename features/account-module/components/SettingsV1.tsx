"use client";

import Link from "next/link";
import {
  ChevronRightLineIcon,
  DocumentLineIcon,
  GlobeLineIcon,
  HeadsetLineIcon,
  LockLineIcon,
  MoonLineIcon,
  ShieldLineIcon,
  UserLineIcon,
} from "@/components/icons/RvxLineIcons";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import { DeleteAccountFlow } from "@/features/account-module/components/DeleteAccountFlow";

type SettingsRow = {
  label: string;
  href: string;
  icon: React.ReactNode;
  value?: string;
};

type SettingsSection = {
  title: string;
  rows: SettingsRow[];
};

const SECTIONS: SettingsSection[] = [
  {
    title: "Personal Information",
    rows: [{ label: "Edit Profile", href: "/account/profile/edit", icon: <UserLineIcon /> }],
  },
  {
    title: "Security",
    rows: [
      { label: "Password", href: "/account/security", icon: <LockLineIcon /> },
      { label: "Two-Factor Authentication", href: "/account/security", icon: <ShieldLineIcon /> },
    ],
  },
  {
    title: "Privacy",
    rows: [{ label: "Privacy", href: "/account/privacy", icon: <ShieldLineIcon /> }],
  },
  {
    title: "Notifications",
    rows: [{ label: "Notifications", href: "/notifications/settings", icon: <ShieldLineIcon /> }],
  },
  {
    title: "Language",
    rows: [
      { label: "Language", href: "/account/preferences/language", icon: <GlobeLineIcon />, value: "English" },
    ],
  },
  {
    title: "Appearance",
    rows: [
      { label: "Theme", href: "/account/preferences/appearance", icon: <MoonLineIcon />, value: "Light" },
    ],
  },
  {
    title: "Help & Support",
    rows: [
      { label: "Help Centre", href: "/help", icon: <HeadsetLineIcon /> },
      { label: "About ROVEXO", href: "/help/policies", icon: <DocumentLineIcon /> },
    ],
  },
];

export function SettingsV1() {
  return (
    <AccountModuleShell title="Settings" backHref="/account" version="v1.1">
      <div className="acm-settings" data-settings-version="v1.1">
        {SECTIONS.map((section) => (
          <section key={section.title} className="acm-settings__section">
            <h2 className="acm-settings__heading">{section.title}</h2>
            <div className="acm-settings__card">
              {section.rows.map((row) => (
                <Link key={row.label} href={row.href} className="acm-settings__row">
                  <span className="acm-settings__icon" aria-hidden>
                    {row.icon}
                  </span>
                  <span className="acm-settings__label">{row.label}</span>
                  {row.value ? <span className="acm-settings__value">{row.value}</span> : null}
                  <span className="acm-settings__chevron" aria-hidden>
                    <ChevronRightLineIcon />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <DeleteAccountFlow />
      </div>
    </AccountModuleShell>
  );
}
