"use client";

import { CanonicalMenuRow } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";
import {
  getLegalCentreIcon,
} from "@/lib/legal/legal-centre-consolidation-v1";
import type { LegalDocument } from "@/lib/legal/types";

type LegalIndexCanonicalProps = {
  documents: LegalDocument[];
};

export function LegalIndexCanonical({ documents }: LegalIndexCanonicalProps) {
  return (
    <AccountCanonicalShell title="Legal Centre" backHref="/account/settings" backLabel="Settings" showHeaderTitle>
      <div className="fw-engine__stack" data-full-width-surface="legal-information">
        <p className="cds-section__intro">
          Official ROVEXO Legal Centre — the single hub for every legal document. Settings links here via Legal
          Information only. Each policy has one canonical version.
        </p>
        <div className="fw-engine__group">
          {documents.map((document) => {
            const iconSpec = getLegalCentreIcon(document.slug);
            return (
              <CanonicalMenuRow
                key={document.slug}
                href={`/legal/${document.slug}`}
                title={document.title}
                description={document.summary}
                icon={
                  <SettingsMenuIconGlyph
                    name={iconSpec?.icon ?? "document"}
                    tone={iconSpec?.tone ?? "purple"}
                  />
                }
              />
            );
          })}
        </div>
        <p className="cds-section__intro">Related</p>
        <div className="fw-engine__group">
          <CanonicalMenuRow
            href="/help"
            title="Help Centre"
            description="Guides and FAQs"
          />
          <CanonicalMenuRow
            href="/account/privacy"
            title="Privacy Settings"
            description="Account privacy controls — not the Privacy Policy"
          />
          <CanonicalMenuRow
            href="/about"
            title="About ROVEXO"
            description="How the marketplace works"
          />
          <CanonicalMenuRow
            href="/support"
            title="Contact Support"
            description="Submit a support request"
          />
        </div>
      </div>
    </AccountCanonicalShell>
  );
}
