import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import {
  DocumentLineIcon,
  InfoLineIcon,
} from "@/components/icons/RvxLineIcons";
import { ROVEXO_APP_VERSION } from "@/lib/app/version";


export function SettingsAboutV1() {
  return (
    <>
      <CanonicalSection title="About ROVEXO">
        <CanonicalCard variant="list" className="px-ds-5 py-ds-4">
          <p className="text-sm text-text-secondary">App Version</p>
          <p className="mt-ds-1 text-lg font-semibold text-text-primary">ROVEXO {ROVEXO_APP_VERSION}</p>
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
