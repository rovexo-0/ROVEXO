"use client";

import Link from "next/link";
import {
  BankLineIcon,
  ChevronRightLineIcon,
  CreditCardLineIcon,
  DocumentLineIcon,
  GlobeLineIcon,
  HeadsetLineIcon,
  LockLineIcon,
  MailLineIcon,
  MoonLineIcon,
  PhoneLineIcon,
  PoundLineIcon,
  ShieldLineIcon,
  UserLineIcon,
} from "@/components/icons/RvxLineIcons";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";

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
    title: "Account",
    rows: [
      { label: "Edit Profile", href: "/account/profile/edit", icon: <UserLineIcon /> },
      { label: "Change Email", href: "/account/profile/edit", icon: <MailLineIcon /> },
      { label: "Change Password", href: "/account/security", icon: <LockLineIcon /> },
      { label: "Change Phone", href: "/account/profile/edit", icon: <PhoneLineIcon /> },
    ],
  },
  {
    title: "Payments",
    rows: [
      { label: "Bank Account", href: "/wallet", icon: <BankLineIcon /> },
      { label: "Payment Methods", href: "/account/payment-methods", icon: <CreditCardLineIcon /> },
    ],
  },
  {
    title: "Preferences",
    rows: [
      { label: "Language", href: "/account/preferences/language", icon: <GlobeLineIcon />, value: "English" },
      { label: "Currency", href: "/account/preferences/currency", icon: <PoundLineIcon />, value: "GBP (£)" },
      { label: "Country", href: "/account/addresses", icon: <GlobeLineIcon />, value: "United Kingdom" },
      { label: "Theme", href: "/account/preferences/appearance", icon: <MoonLineIcon />, value: "Light" },
    ],
  },
  {
    title: "Support",
    rows: [
      { label: "Help Centre", href: "/support", icon: <HeadsetLineIcon /> },
      { label: "Contact Support", href: "/support", icon: <HeadsetLineIcon /> },
      { label: "Terms & Conditions", href: "/help/policies", icon: <DocumentLineIcon /> },
      { label: "Privacy Policy", href: "/account/privacy", icon: <ShieldLineIcon /> },
    ],
  },
];

export function SettingsV1() {
  return (
    <AccountModuleShell title="Settings" backHref="/account" version="v1.0">
      <div className="acm-settings" data-settings-version="v1.0">
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
      </div>
    </AccountModuleShell>
  );
}
