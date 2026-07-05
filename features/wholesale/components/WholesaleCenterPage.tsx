import { RfqSubmitForm } from "@/features/wholesale/components/RfqSubmitForm";
import { WholesaleMobileNav } from "@/features/wholesale/components/WholesaleMobileNav";
import { WholesalePricingManager } from "@/features/wholesale/components/WholesalePricingManager";
import { ResponsiveShell } from "@/features/mobile-ui";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { RfqRequest, WholesaleAccount } from "@/lib/wholesale/types";
import { WHOLESALE_FEATURES } from "@/lib/wholesale/types";

type WholesaleCenterPageProps = {
  account: WholesaleAccount | null;
  rfqs: RfqRequest[];
};

export function WholesaleCenterPage({ account, rfqs }: WholesaleCenterPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-ds-8 px-ds-4 py-ds-6">
      <section className="rounded-ds-xl bg-gradient-to-br from-primary/10 via-surface to-surface p-ds-6">
        <p className="text-sm font-medium text-primary">ROVEXO Wholesale Center</p>
        <h1 className="mt-ds-2 text-3xl font-bold text-text-primary">Wholesale & B2B</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          MOQ, bulk pricing, RFQ, verified suppliers, and company-to-company trade tools.
        </p>
      </section>

      <ResponsiveShell
        mobile={<WholesaleMobileNav />}
        desktop={
          <section className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickNav href="/business/inventory" label="Bulk pricing" />
            <QuickNav href="/business/directory" label="Business directory" />
            <QuickNav href="/plans" label="Wholesale plans" />
            <QuickNav href="/help/category/wholesale" label="Wholesale help" />
            <QuickNav href="/trust#verification" label="Verification" />
            <QuickNav href="/business/dashboard" label="Business dashboard" />
          </section>
        }
      />

      <section className="grid gap-ds-4 lg:grid-cols-[1fr_1fr]">
        <Card padding="lg" className="">
          <h2 className="text-lg font-semibold">Your wholesale account</h2>
          {account ? (
            <div className="mt-ds-4 space-y-ds-2 text-sm text-text-secondary">
              <p>
                <span className="font-medium text-text-primary">{account.companyName}</span>
              </p>
              <p>Type: {account.accountType}</p>
              <p>Default MOQ: {account.moqDefault}</p>
              <div className="flex flex-wrap gap-ds-2 pt-ds-2">
                {account.verified ? <Badge>Verified Wholesale</Badge> : null}
                {account.bulkPricingEnabled ? <Badge>Bulk Pricing</Badge> : null}
                {account.rfqEnabled ? <Badge>RFQ Enabled</Badge> : null}
              </div>
            </div>
          ) : (
            <p className="mt-ds-4 text-sm text-text-secondary">
              No wholesale account yet.{" "}
              <Link href="/business/dashboard" className="text-primary underline">
                Set up from Business Dashboard
              </Link>
            </p>
          )}
        </Card>

        <Card padding="lg" className="" id="pricing">
          <h2 className="text-lg font-semibold">Bulk pricing tiers</h2>
          {account?.bulkPricingEnabled ? (
            <div className="mt-ds-4">
              <WholesalePricingManager />
            </div>
          ) : (
            <p className="mt-ds-4 text-sm text-text-secondary">
              Enable bulk pricing from your{" "}
              <Link href="/business/inventory" className="text-primary underline">
                business inventory
              </Link>
              .
            </p>
          )}
        </Card>
      </section>

      <section className="grid gap-ds-4 lg:grid-cols-[1fr_1fr]">
        <Card padding="lg" className="lg:col-span-2">
          <h2 className="text-lg font-semibold">Wholesale features</h2>
          <ResponsiveShell
            mobile={
              <div className="mt-ds-4 mhub-grid">
                {WHOLESALE_FEATURES.map((feature) => (
                  <div key={feature.id} className="mhub-card mhub-toggle-card">
                    <p className="font-medium text-text-primary">{feature.title}</p>
                    <p className="mt-ds-1 text-sm text-text-secondary">{feature.description}</p>
                  </div>
                ))}
              </div>
            }
            desktop={
              <ul className="mt-ds-4 space-y-ds-3">
                {WHOLESALE_FEATURES.map((feature) => (
                  <li key={feature.id}>
                    <p className="font-medium text-text-primary">{feature.title}</p>
                    <p className="text-sm text-text-secondary">{feature.description}</p>
                  </li>
                ))}
              </ul>
            }
          />
        </Card>
      </section>

      <RfqSubmitForm />

      <section>
        <h2 className="text-lg font-semibold">Open RFQ requests</h2>
        <div className="mt-ds-4 grid gap-ds-3">
          {rfqs.length ? (
            rfqs.map((rfq) => (
              <Card key={rfq.id} padding="md" className="">
                <div className="flex items-start justify-between gap-ds-3">
                  <div>
                    <p className="font-semibold text-text-primary">{rfq.title}</p>
                    <p className="mt-ds-1 text-sm text-text-secondary">{rfq.description}</p>
                    <p className="mt-ds-2 text-xs text-text-muted">
                      Qty {rfq.quantity}
                      {rfq.categorySlug ? ` · ${rfq.categorySlug}` : ""}
                    </p>
                  </div>
                  {rfq.premium ? <Badge>Premium RFQ</Badge> : null}
                </div>
              </Card>
            ))
          ) : (
            <Card padding="md" className="">
              <p className="text-sm text-text-secondary">No open RFQ requests yet.</p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function QuickNav({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <Card padding="sm" interactive className="">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
      </Card>
    </Link>
  );
}
