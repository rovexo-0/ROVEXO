"use client";

import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";
import { CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { DeleteAccountFlow } from "@/features/account-module/components/DeleteAccountFlow";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";
import "@/styles/rovexo/account-settings-canonical.css";

type SettingsMenuSectionsProps = {
  returnTo: string | null;
  activeListingCount?: number;
};

/**
 * Settings — Full Width Engine v1.0 (Profile reference).
 * Flat 100% rows · section titles · no cards / borders / shadows.
 */
export function SettingsMenuSections({
  returnTo,
  activeListingCount = 0,
}: SettingsMenuSectionsProps) {
  const sections = buildSettingsMenuSections(returnTo, { activeListingCount });

  return (
    <nav
      className="settings-canonical settings-canonical-v1 fw-engine__stack"
      aria-label="Settings"
      data-settings-canonical="v1.0"
      data-settings-lock="permanent"
      data-full-width-surface="settings"
    >
      {sections.map((section) => (
        <CanonicalSection key={section.id} title={section.title}>
          <div className="fw-engine__group" data-section={section.id}>
            {section.rows.map((row) => (
              <CanonicalMenuRow
                key={row.id}
                id={`settings-${row.id}`}
                href={row.href}
                title={row.title}
                description={row.subtitle}
                icon={<SettingsMenuIconGlyph name={row.icon} tone={row.tone} />}
              />
            ))}
          </div>
        </CanonicalSection>
      ))}

      <CanonicalSection title="DANGER ZONE" danger>
        <div className="fw-engine__group" data-section="danger">
          <DeleteAccountFlow dangerRow />
        </div>
      </CanonicalSection>
    </nav>
  );
}
