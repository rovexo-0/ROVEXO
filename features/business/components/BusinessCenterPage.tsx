"use client";

import { MobileHubNavigator } from "@/features/mobile-ui";
import { ResponsiveShell } from "@/features/mobile-ui";
import type { UserProfile } from "@/lib/profile/types";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { HubSectionIcon } from "@/components/icons/HubSectionIcon";
import { Card } from "@/components/ui/Card";

function buildBusinessSections(storeSlug: string) {
  return [
    { title: "Business tools", description: "Overview, revenue, orders, and performance", href: "/business/dashboard" },
    { title: "Inventory", description: "SKU management and stock levels", href: "/business/inventory" },
    { title: "Analytics", description: "Business insights and reports", href: "/business/analytics" },
    { title: "Company Profile", description: "Store page and business branding", href: `/store/${storeSlug}` },
    { title: "Business Directory", description: "Discover verified business stores", href: "/business/directory" },
    { title: "Wholesale Center", description: "MOQ, bulk pricing, and RFQ", href: "/wholesale" },
    { title: "Verification", description: "Business and trade verification", href: "/trust#verification" },
    { title: "Trust Score", description: "Business reputation and trust history", href: "/trust" },
    { title: "Marketing", description: "Promotions and featured listings", href: "/seller/listings" },
    { title: "Messages", description: "Leads and buyer conversations", href: "/inbox" },
    { title: "Subscriptions", description: "Business and wholesale plans", href: "/plans" },
    { title: "Help Center", description: "Business help and guided troubleshooting", href: "/help/category/business-accounts" },
  ] as const;
}

type BusinessCenterPageProps = {
  profile: UserProfile;
  companyName: string;
  storeSlug: string;
  verifiedBusiness: boolean;
  verifiedWholesale?: boolean;
  verifiedManufacturer?: boolean;
  verifiedSupplier?: boolean;
  trustScore: number;
};

export function BusinessCenterPage({
  profile,
  companyName,
  storeSlug,
  verifiedBusiness,
  verifiedWholesale,
  verifiedManufacturer,
  verifiedSupplier,
  trustScore,
}: BusinessCenterPageProps) {
  const sections = buildBusinessSections(storeSlug);

  const hero = (
    <section className="mhub-hero lg:rounded-ds-xl lg:bg-gradient-to-br lg:from-primary/10 lg:via-surface lg:to-surface lg:p-ds-6">
      <p className="text-sm font-medium text-primary">ROVEXO Business Center</p>
      <h1 className="mt-ds-2 text-2xl font-bold text-text-primary lg:text-3xl">{companyName}</h1>
      <p className="mt-ds-2 text-sm text-text-secondary">
        Business sellers, company profiles, wholesale tools, verification, analytics, and marketing.
      </p>
      <div className="mt-ds-4 flex flex-wrap gap-ds-2">
        {verifiedBusiness ? <Badge>Verified Business</Badge> : null}
        {verifiedWholesale ? <Badge>Verified Wholesale</Badge> : null}
        {verifiedManufacturer ? <Badge>Verified Manufacturer</Badge> : null}
        {verifiedSupplier ? <Badge>Verified Supplier</Badge> : null}
        <Badge>Trust Score {trustScore}</Badge>
      </div>
    </section>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-ds-6 px-ds-4 py-ds-6">
      {hero}

      <ResponsiveShell
        mobile={
          <MobileHubNavigator
            profile={profile}
            defaultHub="business"
            startExpanded
            context={{ storeSlug }}
            sectionTitle="Explore ROVEXO"
          />
        }
        desktop={
          <section className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Link key={section.href} href={section.href}>
                <Card padding="md" interactive className="h-full">
                  <HubSectionIcon href={section.href} />
                  <p className="mt-ds-2 font-semibold text-text-primary">{section.title}</p>
                  <p className="mt-ds-1 text-sm text-text-secondary">{section.description}</p>
                </Card>
              </Link>
            ))}
          </section>
        }
      />
    </div>
  );
}
