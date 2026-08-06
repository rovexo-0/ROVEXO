"use client";

import Link from "next/link";
import {
  AccountIcon,
  type AccountIconName,
} from "@/components/account/AccountIcons";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { formatGbp } from "@/lib/compliance/hmrc-engine-v1";
import type { HmrcSellerSnapshot } from "@/lib/compliance/hmrc-snapshot-types-v1";
import { HMRC_REPORTING_CENTRE_UI_V1 } from "@/lib/compliance/hmrc-reporting-centre-ui-v1";
import "@/styles/rovexo/hmrc-reporting-centre-v1.css";

type ComplianceDashboardProps = {
  snapshot: HmrcSellerSnapshot;
};

function StatusGlyph({ tone }: { tone: string }) {
  if (tone === "green" || tone === "blue") return <span aria-hidden>✓</span>;
  if (tone === "amber") return <span aria-hidden>!</span>;
  return <span aria-hidden>×</span>;
}

function PrefillIcon({ id }: { id: string }): AccountIconName {
  if (id === "full_name") return "profile";
  if (id === "address") return "address";
  if (id === "date_of_birth") return "verification";
  if (id === "nino") return "security";
  return "help";
}

export function ComplianceDashboard({ snapshot }: ComplianceDashboardProps) {
  const { counters, status, reportingStatusLabel, prefill, documents } = snapshot;

  return (
    <AccountCanonicalShell
      title={HMRC_REPORTING_CENTRE_UI_V1.title}
      backHref="/account/settings"
      backLabel="Settings"
      showHeaderTitle
      bottomNavTab="account"
    >
      <div
        className="hmrc-rc"
        data-hmrc-reporting-centre="v1.1"
        data-hmrc-engine="v1.0"
      >
        <header className="hmrc-rc__intro">
          <h2 className="hmrc-rc__page-title">{HMRC_REPORTING_CENTRE_UI_V1.title}</h2>
          <p className="hmrc-rc__page-sub">
            Stay informed about your UK tax reporting obligations.
          </p>
        </header>

        <section aria-label="Reporting status">
          {status.ctaHref ? (
            <Link
              href={status.ctaHref}
              className={`hmrc-rc__status hmrc-rc__status--${status.tone}`}
            >
              <span className="hmrc-rc__status-badge" aria-hidden>
                <StatusGlyph tone={status.tone} />
              </span>
              <div className="hmrc-rc__status-body">
                <p className="hmrc-rc__status-title">{status.title}</p>
                <p className="hmrc-rc__status-text">{status.description}</p>
                {status.ctaLabel ? (
                  <p className="hmrc-rc__status-cta">{status.ctaLabel}</p>
                ) : null}
              </div>
              <span className="hmrc-rc__status-chevron" aria-hidden>
                ›
              </span>
            </Link>
          ) : (
            <div className={`hmrc-rc__status hmrc-rc__status--${status.tone}`} role="status">
              <span className="hmrc-rc__status-badge" aria-hidden>
                <StatusGlyph tone={status.tone} />
              </span>
              <div className="hmrc-rc__status-body">
                <p className="hmrc-rc__status-title">{status.title}</p>
                <p className="hmrc-rc__status-text">{status.description}</p>
              </div>
            </div>
          )}
        </section>

        <section className="hmrc-rc__card" aria-labelledby="hmrc-your-reporting">
          <h3 id="hmrc-your-reporting" className="hmrc-rc__card-title">
            Your reporting
          </h3>
          <ul className="hmrc-rc__metric-list">
            <li className="hmrc-rc__metric-row">
              <span className="hmrc-rc__metric-icon" aria-hidden>
                <AccountIcon name="verification" />
              </span>
              <span className="hmrc-rc__metric-label">Tax year</span>
              <span className="hmrc-rc__metric-value">{counters.currentTaxYear}</span>
            </li>
            <li className="hmrc-rc__metric-row">
              <span className="hmrc-rc__metric-icon" aria-hidden>
                <AccountIcon name="orders" />
              </span>
              <span className="hmrc-rc__metric-label">Completed sales</span>
              <span className="hmrc-rc__metric-value">{counters.completedSales}</span>
            </li>
            <li className="hmrc-rc__metric-row">
              <span className="hmrc-rc__metric-icon" aria-hidden>
                <AccountIcon name="wallet" />
              </span>
              <span className="hmrc-rc__metric-label">Gross sales</span>
              <span className="hmrc-rc__metric-value">{formatGbp(counters.grossSales)}</span>
            </li>
            <li className="hmrc-rc__metric-row">
              <span className="hmrc-rc__metric-icon" aria-hidden>
                <AccountIcon name="security" />
              </span>
              <span className="hmrc-rc__metric-label">Reporting status</span>
              <span className="hmrc-rc__metric-value">{reportingStatusLabel}</span>
            </li>
          </ul>
        </section>

        <section className="hmrc-rc__card" aria-labelledby="hmrc-progress">
          <h3 id="hmrc-progress" className="hmrc-rc__card-title">
            Reporting progress
          </h3>
          <p className="hmrc-rc__progress-figures">
            <span className="hmrc-rc__progress-current">{formatGbp(counters.grossSales)}</span>
            <span className="hmrc-rc__progress-sep"> / </span>
            <span className="hmrc-rc__progress-threshold">{formatGbp(counters.threshold)}</span>
          </p>
          <p className="hmrc-rc__progress-caption">HMRC reporting threshold</p>
          <div
            className="hmrc-rc__progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={counters.percentage}
            aria-label={`${counters.percentage}% of HMRC reporting threshold`}
          >
            <div
              className="hmrc-rc__progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, counters.percentage))}%` }}
            >
              <span className="hmrc-rc__progress-pill">{counters.percentage}%</span>
            </div>
          </div>
        </section>

        <section className="hmrc-rc__card" aria-labelledby="hmrc-prefill">
          <div className="hmrc-rc__card-head">
            <h3 id="hmrc-prefill" className="hmrc-rc__card-title">
              Review pre-filled information
            </h3>
            <Link href="/seller/tax" className="hmrc-rc__edit-btn">
              Edit information
            </Link>
          </div>
          <p className="hmrc-rc__card-copy">
            Please review your information below. Contact support if anything is incorrect.
          </p>
          <ul className="hmrc-rc__prefill-list">
            {prefill.map((field) => (
              <li key={field.id} className="hmrc-rc__prefill-row">
                <span className="hmrc-rc__prefill-icon" aria-hidden>
                  <AccountIcon name={PrefillIcon({ id: field.id })} />
                </span>
                <div className="hmrc-rc__prefill-copy">
                  <p className="hmrc-rc__prefill-label">{field.label}</p>
                  <p className="hmrc-rc__prefill-value">{field.value}</p>
                </div>
                {field.verified ? (
                  <span className="hmrc-rc__verified">
                    <span aria-hidden>✓</span> Verified
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="hmrc-rc__secure-note">
            <span aria-hidden>
              <AccountIcon name="security" />
            </span>
            Your information is securely encrypted and only shared with HMRC if required by law.
          </p>
        </section>

        <section className="hmrc-rc__card" id="hmrc-documents" aria-labelledby="hmrc-docs">
          <h3 id="hmrc-docs" className="hmrc-rc__card-title">
            Documents
          </h3>
          <ul className="hmrc-rc__doc-list">
            {documents.map((doc) => (
              <li key={doc.id}>
                {doc.available ? (
                  <a
                    className="hmrc-rc__doc-row"
                    href={`/api/seller/compliance/documents/${doc.id}`}
                    download={doc.filename}
                  >
                    <span className="hmrc-rc__doc-icon" aria-hidden>
                      <AccountIcon name="legal" />
                    </span>
                    <span className="hmrc-rc__doc-copy">
                      <span className="hmrc-rc__doc-title">{doc.title}</span>
                      <span className="hmrc-rc__doc-sub">{doc.description}</span>
                    </span>
                    <span className="hmrc-rc__doc-download" aria-hidden>
                      ↓
                    </span>
                  </a>
                ) : (
                  <div
                    className="hmrc-rc__doc-row hmrc-rc__doc-row--unavailable"
                    aria-disabled="true"
                  >
                    <span className="hmrc-rc__doc-icon" aria-hidden>
                      <AccountIcon name="legal" />
                    </span>
                    <span className="hmrc-rc__doc-copy">
                      <span className="hmrc-rc__doc-title">{doc.title}</span>
                      <span className="hmrc-rc__doc-sub">Not available yet</span>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="hmrc-rc__card" aria-labelledby="hmrc-important">
          <h3 id="hmrc-important" className="hmrc-rc__card-title">
            Important information
          </h3>
          <p className="hmrc-rc__legal">
            ROVEXO reports seller information to HMRC only where required by UK regulations.
            Receiving a report does not automatically mean you owe tax. You are responsible for
            your own tax obligations.
          </p>
        </section>

        <section className="hmrc-rc__card" aria-labelledby="hmrc-help">
          <h3 id="hmrc-help" className="hmrc-rc__card-title">
            Need help?
          </h3>
          <ul className="hmrc-rc__help-list">
            <li>
              <a
                className="hmrc-rc__help-row"
                href="https://www.gov.uk/guidance/find-out-about-the-trading-and-property-allowances"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="hmrc-rc__help-icon" aria-hidden>
                  <AccountIcon name="business" />
                </span>
                <span className="hmrc-rc__help-copy">
                  <span className="hmrc-rc__help-title">HMRC guidance</span>
                  <span className="hmrc-rc__help-sub">Find out more about your tax obligations</span>
                </span>
                <span className="hmrc-rc__help-ext" aria-hidden>
                  ↗
                </span>
              </a>
            </li>
            <li>
              <Link className="hmrc-rc__help-row" href="/support">
                <span className="hmrc-rc__help-icon" aria-hidden>
                  <AccountIcon name="support" />
                </span>
                <span className="hmrc-rc__help-copy">
                  <span className="hmrc-rc__help-title">Contact support</span>
                  <span className="hmrc-rc__help-sub">Our team is here to help</span>
                </span>
                <span className="hmrc-rc__help-ext" aria-hidden>
                  ↗
                </span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </AccountCanonicalShell>
  );
}
