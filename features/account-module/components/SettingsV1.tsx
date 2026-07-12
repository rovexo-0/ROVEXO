"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { DeleteAccountFlow } from "@/features/account-module/components/DeleteAccountFlow";
import {
  SettingsAccordion,
  type SettingsAccordionGroup,
} from "@/features/account-module/components/SettingsAccordion";
import { CanonicalButton, CanonicalButtonLink, CanonicalCard, CanonicalSection } from "@/src/components/canonical";

function buildAccordionGroups(returnTo: string | null): SettingsAccordionGroup[] {
  const withReturn = (href: string) =>
    returnTo ? `${href}?returnTo=${encodeURIComponent(returnTo)}` : href;

  return [
    {
      id: "profile",
      title: "Profile",
      rows: [
        { label: "Profile", href: withReturn("/account/profile") },
        { label: "Addresses", href: withReturn("/account/addresses") },
      ],
    },
    {
      id: "payments",
      title: "Payments",
      rows: [
        { label: "Payment Methods", href: withReturn("/account/payment-methods") },
        { label: "Bank Account", href: withReturn("/account/settings/bank-account") },
        { label: "Tax Information", href: withReturn("/seller/tax") },
      ],
    },
    {
      id: "notifications",
      title: "Notifications",
      rows: [
        { label: "Notification Preferences", href: withReturn("/notifications/settings") },
        { label: "Marketing Preferences", href: withReturn("/account/privacy") },
      ],
    },
    {
      id: "privacy-security",
      title: "Privacy & Security",
      rows: [
        { label: "Privacy", href: withReturn("/account/privacy") },
        { label: "Security", href: withReturn("/account/security") },
        { label: "Connected Accounts", href: withReturn("/account/security") },
        { label: "Devices & Sessions", href: withReturn("/account/security") },
        { label: "Blocked Users", href: withReturn("/account/blocked-users") },
      ],
    },
    {
      id: "preferences",
      title: "Preferences",
      rows: [
        { label: "Language", href: withReturn("/account/preferences/language"), value: "English" },
        { label: "Currency", href: withReturn("/account/preferences/currency"), value: "GBP" },
        { label: "Accessibility", href: "/legal/accessibility-statement" },
      ],
    },
    {
      id: "legal",
      title: "Legal",
      rows: [
        { label: "Legal Documents", href: "/legal" },
        { label: "Terms", href: "/legal/terms-and-conditions" },
        { label: "Privacy Policy", href: "/legal/privacy-policy" },
        { label: "Cookie Policy", href: "/legal/cookie-policy" },
      ],
    },
  ];
}

export function SettingsV1() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const groups = buildAccordionGroups(returnTo);

  return (
    <AccountCanonicalShell title="Settings" backHref="/account">
      <AccountPageStack>
        <SettingsAccordion groups={groups} />
        <div className="mt-4 flex justify-center">
          <DeleteAccountFlow standalone />
        </div>
      </AccountPageStack>
    </AccountCanonicalShell>
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
    <AccountCanonicalShell title="Bank Account" backHref={backHref}>
      <AccountPageStack>
        <SettingsBankAccountPanel connected={connected} returnTo={returnTo} />
      </AccountPageStack>
    </AccountCanonicalShell>
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <CanonicalSection title="Bank Account">
        <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
          {connected ? (
            <p className="account-settings-empty">Bank account connected.</p>
          ) : (
            <p className="account-settings-empty">No bank account added.</p>
          )}
          <CanonicalButton type="button" fullWidth onClick={() => setOpen(true)}>
            {connected ? "Manage Bank Account" : "Add Bank Account"}
          </CanonicalButton>
        </CanonicalCard>
      </CanonicalSection>

      {returnTo ? (
        <CanonicalButtonLink href={returnTo} variant="ghost" className="mt-ds-2">
          Continue where you left off
        </CanonicalButtonLink>
      ) : null}

      <BankAccountModalLazy
        open={open}
        connected={connected}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setConnected(true);
          setOpen(false);
        }}
        onRemoved={() => {
          setConnected(false);
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
  onRemoved,
  returnTo,
}: {
  open: boolean;
  connected: boolean;
  onClose: () => void;
  onSaved: () => void;
  onRemoved: () => void;
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
      onRemoved={onRemoved}
    />
  );
}
