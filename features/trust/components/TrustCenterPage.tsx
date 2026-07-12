"use client";

import Link from "next/link";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { CanonicalModuleBody } from "@/components/ui/canonical";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MobileHubNavigator } from "@/features/mobile-ui";
import { ResponsiveShell } from "@/features/mobile-ui";
import { MobileHubSections } from "@/features/mobile-ui";
import { TrustVerificationActions } from "@/features/trust/components/TrustVerificationActions";
import { TrustScoreMeter } from "@/features/trust/components/TrustScoreMeter";
import { TrustTierBadge } from "@/features/trust/components/TrustTierBadge";
import type { TrustDashboardData } from "@/lib/trust/types";
import { TRUST_CENTER_SECTIONS, VERIFICATION_TYPES } from "@/lib/trust/types";
import { getTrustHubSections } from "@/lib/mobile-ui/hubs";
import { HubSectionIcon } from "@/components/icons/HubSectionIcon";
import { cn } from "@/lib/cn";

type TrustCenterPageProps = {
  data: TrustDashboardData;
};

export function TrustCenterPage({ data }: TrustCenterPageProps) {
  const hero = (
    <p className="pcu-intro">
      Purchase protection, seller protection, verification, disputes, and community safety.
    </p>
  );

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col">
      <CanonicalPageHeader title="Trust Center" backHref="/account" backLabel="My Account" />
      <CanonicalModuleBody flush>
        {hero}

      <section id="score" className="grid gap-ds-3">
        <Card padding="lg" variant="canonical">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Trust Score</h2>
            <TrustTierBadge tier={data.score.tier} />
          </div>
          <TrustScoreMeter
            score={data.score.score}
            tier={data.score.tier}
            progressPercent={data.progress.percent}
            nextTier={data.progress.next}
            className="mt-ds-4"
          />
          <div className="mt-ds-5 grid grid-cols-2 gap-ds-3 lg:grid-cols-3">
            <ScorePill label="Buyer" value={data.score.buyerScore} />
            <ScorePill label="Seller" value={data.score.sellerScore} />
            <ScorePill label="Business" value={data.score.businessScore} className="col-span-2 lg:col-span-1" />
          </div>
          {data.badges.length > 0 && (
            <div className="mt-ds-5 flex flex-wrap gap-ds-2">
              {data.badges.map((badge) => (
                <Badge key={badge}>{badge}</Badge>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg" variant="canonical" className="mhub-desktop">
          <h2 className="text-lg font-semibold">How to improve</h2>
          <ul className="mt-ds-4 space-y-ds-2 text-sm text-text-secondary">
            {data.recommendations.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <ResponsiveShell
        mobile={
          <>
            <MobileHubSections sections={getTrustHubSections()} />
            <MobileHubNavigator defaultHub="support" sectionTitle="All hubs" />
          </>
        }
        desktop={
          <section>
            <h2 className="text-lg font-semibold">Trust Center</h2>
            <div className="mt-ds-4 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
              {TRUST_CENTER_SECTIONS.map((section) => (
                <Link key={section.id} href={section.href}>
                  <Card padding="md" variant="canonical" interactive className="h-full">
                    <HubSectionIcon trustSectionId={section.id} />
                    <p className="mt-ds-2 font-semibold text-text-primary">{section.title}</p>
                    <p className="mt-ds-1 text-sm text-text-secondary">{section.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        }
      />

      <section id="verification" className="mhub-desktop">
        <h2 className="text-lg font-semibold">Verification Status</h2>
        <div className="mt-ds-4 grid gap-ds-3 md:grid-cols-2 lg:grid-cols-3">
          {VERIFICATION_TYPES.map((item) => {
            const record = data.verifications.find((entry) => entry.verificationType === item.type);
            return (
              <Card key={item.type} padding="md" variant="canonical">
                <div className="flex items-start justify-between gap-ds-3">
                  <div>
                    <p className="font-semibold text-text-primary">{item.label}</p>
                    <p className="mt-ds-1 text-sm text-text-secondary">{item.description}</p>
                  </div>
                  <Badge>{record?.status ?? "not_started"}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
        <Card padding="lg" variant="canonical" className="mt-ds-4">
          <h3 className="font-semibold text-text-primary">Request verification</h3>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Submit verification requests for moderator review.
          </p>
          <TrustVerificationActions verifications={data.verifications} />
        </Card>
      </section>

      <section id="history" className="mhub-desktop">
        <h2 className="text-lg font-semibold">Recent score changes</h2>
        <Card padding="lg" variant="canonical" className="mt-ds-4">
          {data.recentEvents.length ? (
            <ul className="space-y-ds-3 text-sm text-text-secondary">
              {data.recentEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-ds-3 border-b border-border pb-ds-2 last:border-0 last:pb-0"
                >
                  <span>{event.reason ?? event.eventType.replace(/_/g, " ")}</span>
                  <span className={event.delta >= 0 ? "font-semibold text-success" : "font-semibold text-danger"}>
                    {event.delta >= 0 ? `+${event.delta}` : event.delta}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No trust events yet.</p>
          )}
        </Card>
      </section>
      </CanonicalModuleBody>
    </div>
  );
}

function ScorePill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-ds-lg bg-surface-muted px-ds-3 py-ds-2", className)}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}
