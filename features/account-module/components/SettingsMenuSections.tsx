"use client";

import { useTransition } from "react";
import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";
import { signOut } from "@/lib/auth/actions";
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { DeleteAccountFlow } from "@/features/account-module/components/DeleteAccountFlow";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";
import "@/styles/rovexo/account-settings-canonical.css";

type SettingsMenuSectionsProps = {
  returnTo: string | null;
};

export function SettingsMenuSections({ returnTo }: SettingsMenuSectionsProps) {
  const [isSigningOut, startSignOut] = useTransition();
  const sections = buildSettingsMenuSections(returnTo);

  return (
    <nav className="settings-canonical" aria-label="Settings" data-settings-canonical="v1.0">
      {sections.map((section) => (
        <CanonicalSection key={section.id} title={section.title}>
          <CanonicalCard variant="list" className="settings-canonical__card">
            {section.rows.map((row) => (
              <CanonicalMenuRow
                key={row.id}
                id={`settings-${row.id}`}
                href={row.href}
                title={row.title}
                description={row.subtitle}
                icon={<SettingsMenuIconGlyph name={row.icon} />}
              />
            ))}
          </CanonicalCard>
        </CanonicalSection>
      ))}

      <CanonicalSection title="DANGER ZONE" danger>
        <CanonicalCard variant="list" className="settings-canonical__card settings-canonical__danger-card">
          <CanonicalMenuRow
            id="settings-sign-out"
            title="Sign Out"
            description="Sign out of this device"
            icon={<SettingsMenuIconGlyph name="logout" />}
            disabled={isSigningOut}
            onClick={() => startSignOut(() => void signOut())}
          />
          <DeleteAccountFlow dangerRow />
        </CanonicalCard>
      </CanonicalSection>
    </nav>
  );
}
