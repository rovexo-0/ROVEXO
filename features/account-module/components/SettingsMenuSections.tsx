"use client";

import {
  buildSettingsMenuSections,
  type SettingsMenuRow,
} from "@/lib/account-center/settings-menu";
import { ROVEXO_APP_VERSION, ROVEXO_BUILD_NUMBER } from "@/lib/app/version";
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { DeleteAccountFlow } from "@/features/account-module/components/DeleteAccountFlow";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";
import { SettingsNotificationToggles } from "@/features/account-module/components/SettingsNotificationToggles";
import "@/styles/rovexo/account-settings-canonical.css";

type SettingsMenuSectionsProps = {
  returnTo: string | null;
};

function ComingSoonBadge() {
  return <span className="settings-canonical__soon">Coming soon</span>;
}

function LinkRow({ row }: { row: SettingsMenuRow }) {
  return (
    <CanonicalMenuRow
      id={`settings-${row.id}`}
      href={row.href}
      title={row.title}
      description={row.subtitle}
      comingSoon={row.comingSoon}
      disabled={row.comingSoon}
      trailing={row.comingSoon ? <ComingSoonBadge /> : undefined}
      icon={<SettingsMenuIconGlyph name={row.icon} danger={row.destructive} />}
    />
  );
}

export function SettingsMenuSections({ returnTo }: SettingsMenuSectionsProps) {
  const sections = buildSettingsMenuSections(returnTo);

  return (
    <nav
      className="settings-canonical"
      aria-label="Settings"
      data-settings-canonical="v1.0"
      data-settings-sprint="1-foundation"
    >
      {sections.map((section) => {
        if (section.id === "notifications") {
          const toggleRows = section.rows
            .filter((row) => row.kind === "toggle" && row.toggleKey)
            .map((row) => ({
              id: row.id,
              title: row.title,
              toggleKey: row.toggleKey!,
            }));

          return (
            <CanonicalSection key={section.id} title={section.title}>
              <CanonicalCard variant="list" className="settings-canonical__card">
                <SettingsNotificationToggles rows={toggleRows} />
              </CanonicalCard>
            </CanonicalSection>
          );
        }

        return (
          <CanonicalSection key={section.id} title={section.title}>
            <CanonicalCard variant="list" className="settings-canonical__card">
              {section.rows.map((row) => {
                if (row.action === "delete-account") {
                  return <DeleteAccountFlow key={row.id} dangerRow />;
                }
                return <LinkRow key={row.id} row={row} />;
              })}
            </CanonicalCard>
          </CanonicalSection>
        );
      })}

      <CanonicalSection title="ABOUT">
        <CanonicalCard variant="list" className="settings-canonical__card">
          <CanonicalMenuRow
            id="settings-app-version"
            title="App Version"
            value={ROVEXO_APP_VERSION}
            hideChevron
            icon={<SettingsMenuIconGlyph name="info" />}
          />
          <CanonicalMenuRow
            id="settings-build-number"
            title="Build Number"
            value={ROVEXO_BUILD_NUMBER}
            hideChevron
            icon={<SettingsMenuIconGlyph name="hash" />}
          />
        </CanonicalCard>
      </CanonicalSection>
    </nav>
  );
}
