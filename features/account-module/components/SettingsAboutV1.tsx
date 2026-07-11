import Link from "next/link";
import { ROVEXO_APP_VERSION } from "@/lib/app/version";

export function SettingsAboutV1() {
  return (
    <div className="acm-settings" data-settings-about-version="v2.0-02b">
      <section className="acm-settings__section">
        <div className="acm-settings__card px-ds-4 py-ds-5">
          <p className="text-sm text-text-secondary">App Version</p>
          <p className="mt-ds-1 text-lg font-semibold text-text-primary">ROVEXO {ROVEXO_APP_VERSION}</p>
        </div>
      </section>
      <section className="acm-settings__section">
        <div className="acm-settings__card">
          <Link href="/terms" className="acm-settings__row">
            <span className="acm-settings__label">Terms</span>
          </Link>
          <Link href="/privacy" className="acm-settings__row">
            <span className="acm-settings__label">Privacy Policy</span>
          </Link>
          <Link href="/help/policies" className="acm-settings__row">
            <span className="acm-settings__label">Cookie Policy</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
