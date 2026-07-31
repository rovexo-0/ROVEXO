"use client";

import { CanonicalSection, CanonicalMenuRow } from "@/src/components/canonical";
import { MyAccountTemplate } from "@/features/account-canonical";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";

/**
 * UK v1.0 — Currency & Region is read-only.
 * No picker, dropdown, or multi-country support.
 */
export function AccountCurrencyPage() {
  return (
    <MyAccountTemplate
      surface="currency"
      title="Currency & Region"
      backHref="/account/settings"
      showHeaderTitle
    >
      <div
        className="settings-subpage-v1 fw-engine__stack"
        data-full-width-surface="currency"
        data-currency-region="uk-v1"
      >
        <CanonicalSection title="Region">
          <div className="fw-engine__group">
            <CanonicalMenuRow
              title="Country"
              description="United Kingdom"
              icon={<SettingsMenuIconGlyph name="globe" tone="gold" />}
              value="UK"
              hideChevron
              disabled
            />
            <CanonicalMenuRow
              title="Currency"
              description="GBP (£)"
              icon={<SettingsMenuIconGlyph name="globe" tone="gold" />}
              value="GBP"
              hideChevron
              disabled
            />
            <CanonicalMenuRow
              title="Language"
              description="English"
              icon={<SettingsMenuIconGlyph name="globe" tone="gold" />}
              value="en-GB"
              hideChevron
              disabled
            />
          </div>
        </CanonicalSection>
      </div>
    </MyAccountTemplate>
  );
}
