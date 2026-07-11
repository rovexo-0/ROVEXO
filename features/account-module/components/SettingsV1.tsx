"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BankLineIcon,
  ChevronRightLineIcon,
  CreditCardLineIcon,
  DocumentLineIcon,
  GlobeLineIcon,
  InfoLineIcon,
  LockLineIcon,
  LocationLineIcon,
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
  footer?: React.ReactNode;
};

function buildSections(returnTo: string | null): SettingsSection[] {
  const withReturn = (href: string) =>
    returnTo ? `${href}?returnTo=${encodeURIComponent(returnTo)}` : href;

  return [
    {
      title: "Profile",
      rows: [{ label: "Profile", href: withReturn("/account/profile"), icon: <UserLineIcon /> }],
    },
    {
      title: "Addresses",
      rows: [{ label: "Addresses", href: withReturn("/account/addresses"), icon: <LocationLineIcon /> }],
    },
    {
      title: "Payment Methods",
      rows: [
        {
          label: "Payment Methods",
          href: withReturn("/account/payment-methods"),
          icon: <CreditCardLineIcon />,
        },
      ],
    },
    {
      title: "Bank Account",
      rows: [
        {
          label: "Bank Account",
          href: withReturn("/account/settings/bank-account"),
          icon: <BankLineIcon />,
        },
      ],
    },
    {
      title: "Verification & Tax",
      rows: [
        {
          label: "Identity Verification",
          href: withReturn("/account/profile"),
          icon: <ShieldLineIcon />,
          value: "Automatic",
        },
        {
          label: "Tax Information",
          href: withReturn("/seller/tax"),
          icon: <DocumentLineIcon />,
        },
      ],
    },
    {
      title: "Notifications",
      rows: [
        {
          label: "Notification Preferences",
          href: withReturn("/notifications/settings"),
          icon: <ShieldLineIcon />,
        },
        {
          label: "Marketing Preferences",
          href: withReturn("/account/privacy"),
          icon: <ShieldLineIcon />,
        },
      ],
    },
    {
      title: "Privacy & Security",
      rows: [
        { label: "Privacy", href: withReturn("/account/privacy"), icon: <LockLineIcon /> },
        { label: "Security", href: withReturn("/account/security"), icon: <LockLineIcon /> },
        {
          label: "Connected Accounts",
          href: withReturn("/account/security"),
          icon: <LockLineIcon />,
        },
        {
          label: "Devices & Sessions",
          href: withReturn("/account/security"),
          icon: <LockLineIcon />,
        },
        {
          label: "Blocked Users",
          href: withReturn("/account/blocked-users"),
          icon: <LockLineIcon />,
        },
      ],
    },
    {
      title: "Data & Cookies",
      rows: [
        {
          label: "Cookie Preferences",
          href: "/legal/cookie-policy",
          icon: <DocumentLineIcon />,
        },
        {
          label: "Download My Data",
          href: withReturn("/support?category=data-export"),
          icon: <DocumentLineIcon />,
        },
        {
          label: "Delete My Data",
          href: withReturn("/account/privacy"),
          icon: <DocumentLineIcon />,
        },
      ],
    },
    {
      title: "Regional",
      rows: [
        {
          label: "Language",
          href: withReturn("/account/preferences/language"),
          icon: <GlobeLineIcon />,
          value: "English",
        },
        {
          label: "Currency",
          href: withReturn("/account/preferences/currency"),
          icon: <GlobeLineIcon />,
          value: "GBP",
        },
        {
          label: "Accessibility",
          href: "/legal/accessibility-statement",
          icon: <InfoLineIcon />,
        },
      ],
    },
    {
      title: "Legal",
      rows: [
        { label: "Legal Documents", href: "/legal", icon: <DocumentLineIcon /> },
        { label: "Terms", href: "/legal/terms-and-conditions", icon: <DocumentLineIcon /> },
        { label: "Privacy Policy", href: "/legal/privacy-policy", icon: <DocumentLineIcon /> },
        { label: "Cookie Policy", href: "/legal/cookie-policy", icon: <DocumentLineIcon /> },
      ],
      footer: <DeleteAccountFlow />,
    },
  ];
}

export function SettingsV1() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const sections = buildSections(returnTo);

  return (
    <AccountModuleShell title="Settings" backHref="/account" version="v1.0-production">
      <div className="acm-settings" data-settings-version="v1.0-production">
        {sections.map((section) => (
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
            {section.footer}
          </section>
        ))}
      </div>
    </AccountModuleShell>
  );
}

export function SettingsBankAccountV1({
  connected,
  returnTo,
}: {
  connected: boolean;
  returnTo: string | null;
}) {
  const backHref = returnTo ? `/account/settings?returnTo=${encodeURIComponent(returnTo)}` : "/account/settings";

  return (
    <AccountModuleShell title="Bank Account" backHref={backHref} version="v1.0-production">
      <div className="acm-settings" data-settings-version="v1.0-production-bank">
        <SettingsBankAccountPanel connected={connected} returnTo={returnTo} />
      </div>
    </AccountModuleShell>
  );
}

function SettingsBankAccountPanel({
  connected: initialConnected,
  returnTo,
}: {
  connected: boolean;
  returnTo: string | null;
}) {
  const [connected, setConnected] = useState(initialConnected);
  const [open, setOpen] = useState(!initialConnected);

  return (
    <>
      <p className="mb-ds-4 px-ds-1 text-sm text-text-secondary">
        {connected
          ? "Your payout bank account is connected. Required only for your first listing or withdrawal."
          : "Add your bank account when you are ready to sell or withdraw. Optional until then."}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="acm-settings__row w-full text-left"
      >
        <span className="acm-settings__icon" aria-hidden>
          <BankLineIcon />
        </span>
        <span className="acm-settings__label">{connected ? "Edit Bank Account" : "Add Bank Account"}</span>
        <span className="acm-settings__chevron" aria-hidden>
          <ChevronRightLineIcon />
        </span>
      </button>
      {connected ? (
        <button
          type="button"
          className="acm-settings__row w-full text-left text-danger"
          onClick={() => setOpen(true)}
        >
          <span className="acm-settings__label">Remove Bank Account</span>
        </button>
      ) : null}
      {returnTo ? (
        <div className="mt-ds-6 px-ds-1">
          <Link href={returnTo} className="text-sm font-medium text-primary hover:opacity-80">
            Continue where you left off
          </Link>
        </div>
      ) : null}
      <BankAccountModalLazy
        open={open}
        connected={connected}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setConnected(true);
          setOpen(false);
        }}
        returnTo={returnTo}
      />
    </>
  );
}

function BankAccountModalLazy({
  open,
  connected,
  onClose,
  onSaved,
  returnTo,
}: {
  open: boolean;
  connected: boolean;
  onClose: () => void;
  onSaved: () => void;
  returnTo: string | null;
}) {
  const [BankAccountForm, setBankAccountForm] = useState<
    typeof import("@/features/wallet/components/BankAccountForm").BankAccountForm | null
  >(null);

  useEffect(() => {
    if (!open || BankAccountForm) return;
    void import("@/features/wallet/components/BankAccountForm").then((mod) => {
      setBankAccountForm(() => mod.BankAccountForm);
    });
  }, [BankAccountForm, open]);

  if (!BankAccountForm) return null;

  return (
    <BankAccountForm
      open={open}
      connected={connected}
      onClose={onClose}
      onSaved={() => {
        onSaved();
        if (returnTo) {
          window.location.href = returnTo;
        }
      }}
    />
  );
}
