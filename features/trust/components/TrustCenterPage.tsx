import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrustVerificationActions } from "@/features/trust/components/TrustVerificationActions";
import type { TrustCenterData } from "@/lib/trust/types";
import { TRUST_CENTER_SECTIONS, VERIFICATION_TYPES } from "@/lib/trust/types";

type TrustCenterPageProps = {
  data: TrustCenterData;
};

export function TrustCenterPage({ data }: TrustCenterPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-ds-8 px-ds-4 py-ds-6">
      <section className="rounded-ds-xl bg-gradient-to-br from-primary/10 via-surface to-surface p-ds-6 shadow-ds-soft">
        <p className="text-sm font-medium text-primary">ROVEXO Trust Center</p>
        <h1 className="mt-ds-2 text-3xl font-bold text-text-primary">Trust & Safety</h1>
        <p className="mt-ds-2 max-w-2xl text-sm text-text-secondary">
          Buyer protection, seller protection, verification, disputes, and community safety — all in one place.
        </p>
      </section>

      <section id="score" className="grid gap-ds-4 lg:grid-cols-[1.2fr_1fr]">
        <Card padding="lg" className="shadow-ds-soft">
          <h2 className="text-lg font-semibold">Trust Score</h2>
          <p className="mt-ds-4 text-5xl font-bold text-primary">{data.score.score}</p>
          <p className="mt-ds-1 text-sm capitalize text-text-secondary">Level: {data.score.level}</p>
          <div className="mt-ds-5 grid gap-ds-3 sm:grid-cols-3">
            <ScorePill label="Buyer" value={data.score.buyerScore} />
            <ScorePill label="Seller" value={data.score.sellerScore} />
            <ScorePill label="Business" value={data.score.businessScore} />
          </div>
          {data.badges.length > 0 && (
            <div className="mt-ds-5 flex flex-wrap gap-ds-2">
              {data.badges.map((badge) => (
                <Badge key={badge}>{badge}</Badge>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg" className="shadow-ds-soft">
          <h2 className="text-lg font-semibold">Trust History</h2>
          <ul className="mt-ds-4 space-y-ds-2 text-sm text-text-secondary">
            {data.recentEvents.length ? (
              data.recentEvents.map((event) => (
                <li key={event.id} className="flex justify-between gap-ds-3 border-b border-border pb-ds-2">
                  <span>{event.eventType.replace(/_/g, " ")}</span>
                  <span>{event.delta >= 0 ? `+${event.delta}` : event.delta}</span>
                </li>
              ))
            ) : (
              <li>No trust events yet. Complete verifications to build your score.</li>
            )}
          </ul>
        </Card>
      </section>

      <section id="verification">
        <h2 className="text-lg font-semibold">Verification Status</h2>
        <div className="mt-ds-4 grid gap-ds-3 md:grid-cols-2 lg:grid-cols-3">
          {VERIFICATION_TYPES.map((item) => {
            const record = data.verifications.find((entry) => entry.verificationType === item.type);
            return (
              <Card key={item.type} padding="md" className="shadow-ds-soft">
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
        <Card padding="lg" className="mt-ds-4 shadow-ds-soft">
          <h3 className="font-semibold text-text-primary">Request verification</h3>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Submit verification requests for moderator review. Approved verifications update your trust score.
          </p>
          <TrustVerificationActions verifications={data.verifications} />
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Trust Center</h2>
        <div className="mt-ds-4 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_CENTER_SECTIONS.map((section) => (
            <Link key={section.id} href={section.href}>
              <Card padding="md" interactive className="h-full shadow-ds-soft">
                <p className="text-xl">{section.icon}</p>
                <p className="mt-ds-2 font-semibold text-text-primary">{section.title}</p>
                <p className="mt-ds-1 text-sm text-text-secondary">{section.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-4">
        <TrustQuickLink href="/resolution" label="Resolution Centre" />
        <TrustQuickLink href="/assistant" label="AI Assistant" />
        <TrustQuickLink href="/help" label="Help Centre" />
        <TrustQuickLink href="/support" label="Contact Support" />
      </section>
    </div>
  );
}

function TrustQuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <Card padding="sm" interactive className="shadow-ds-soft">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
      </Card>
    </Link>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-ds-lg bg-surface-muted px-ds-3 py-ds-2">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}
