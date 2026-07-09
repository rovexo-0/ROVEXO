import Link from "next/link";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";

type VerificationRow = {
  label: string;
  description: string;
  href: string;
  status: string;
};

function buildRows(profile: Awaited<ReturnType<typeof fetchProfile>>): VerificationRow[] {
  if (!profile) return [];

  const identityStatus = profile.verified ? "Verified" : "Not started";
  const businessStatus = profile.capabilities.hasBusinessVerification ? "Verified" : "Available";

  return [
    {
      label: "Identity Verification",
      description: "Confirm your identity for payouts and trust",
      href: "/trust",
      status: identityStatus,
    },
    {
      label: "Business Verification",
      description: "Company details, tax registration, and invoices",
      href: "/business/dashboard",
      status: businessStatus,
    },
    {
      label: "Verification Status",
      description: "Trust score, badges, and safety overview",
      href: "/trust",
      status: profile.verified ? "Good standing" : "Action needed",
    },
  ];
}

export async function VerificationHubV1() {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/account/verification");
  }

  const rows = buildRows(profile);

  return (
    <AccountModuleShell title="Verification" backHref="/account" version="v1.0">
      <div className="acm-settings" data-verification-version="v1.0">
        <section className="acm-settings__section">
          <p className="acm-settings__intro">
            Verification unlocks business capabilities on your ROVEXO account. No separate business
            account is required.
          </p>
          <div className="acm-settings__card">
            {rows.map((row) => (
              <Link key={row.label} href={row.href} className="acm-settings__row">
                <span className="acm-settings__copy">
                  <span className="acm-settings__label">{row.label}</span>
                  <span className="acm-settings__description">{row.description}</span>
                </span>
                <span className="acm-settings__value">{row.status}</span>
                <span className="acm-settings__chevron" aria-hidden>
                  <ChevronRightLineIcon />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AccountModuleShell>
  );
}
