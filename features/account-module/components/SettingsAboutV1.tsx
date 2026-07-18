import { CanonicalSection, CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { DocumentLineIcon, InfoLineIcon } from "@/components/icons/RvxLineIcons";

export function SettingsAboutV1() {
  return (
    <>
      <CanonicalSection title="About ROVEXO">
        <CanonicalCard variant="list" className="px-ds-5 py-ds-4">
          <p className="text-sm text-text-secondary">
            ROVEXO is the UK marketplace for buying and selling with protected checkout.
          </p>
        </CanonicalCard>
      </CanonicalSection>
      <CanonicalSection title="Legal">
        <CanonicalCard variant="list">
          <CanonicalMenuRow title="Terms" icon={<DocumentLineIcon />} href="/legal/terms-and-conditions" />
          <CanonicalMenuRow title="Privacy Policy" icon={<DocumentLineIcon />} href="/legal/privacy-policy" />
          <CanonicalMenuRow title="Cookies" icon={<DocumentLineIcon />} href="/legal/cookie-policy" />
          <CanonicalMenuRow title="Licences" icon={<InfoLineIcon />} href="/legal" />
        </CanonicalCard>
      </CanonicalSection>
    </>
  );
}
