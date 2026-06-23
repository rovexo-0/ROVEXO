import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function buildBusinessSections(storeSlug: string) {
  return [
    { title: "Business Dashboard", description: "Overview, revenue, orders, and performance", href: "/business/dashboard", icon: "📊" },
    { title: "Inventory", description: "SKU management and stock levels", href: "/business/inventory", icon: "📦" },
    { title: "Analytics", description: "Business insights and reports", href: "/business/analytics", icon: "📈" },
    { title: "Company Profile", description: "Store page and business branding", href: `/store/${storeSlug}`, icon: "🏪" },
    { title: "Business Directory", description: "Discover verified business stores", href: "/business/directory", icon: "📇" },
    { title: "Wholesale Center", description: "MOQ, bulk pricing, and RFQ", href: "/wholesale", icon: "🏭" },
    { title: "Verification", description: "Business and trade verification", href: "/trust#verification", icon: "✅" },
    { title: "Trust Score", description: "Business reputation and trust history", href: "/trust", icon: "⭐" },
    { title: "Marketing", description: "Promotions and featured listings", href: "/seller/listings", icon: "📣" },
    { title: "Messages", description: "Leads and buyer conversations", href: "/messages", icon: "💬" },
    { title: "Subscriptions", description: "Business and wholesale plans", href: "/plans", icon: "💳" },
    { title: "Help Center", description: "Business help and guided troubleshooting", href: "/help/category/business-accounts", icon: "🎧" },
  ] as const;
}

type BusinessCenterPageProps = {
  companyName: string;
  storeSlug: string;
  verifiedBusiness: boolean;
  verifiedWholesale?: boolean;
  verifiedManufacturer?: boolean;
  verifiedSupplier?: boolean;
  trustScore: number;
};

export function BusinessCenterPage({
  companyName,
  storeSlug,
  verifiedBusiness,
  verifiedWholesale,
  verifiedManufacturer,
  verifiedSupplier,
  trustScore,
}: BusinessCenterPageProps) {
  const sections = buildBusinessSections(storeSlug);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-ds-8 px-ds-4 py-ds-6">
      <section className="rounded-ds-xl bg-gradient-to-br from-primary/10 via-surface to-surface p-ds-6">
        <p className="text-sm font-medium text-primary">ROVEXO Business Center</p>
        <h1 className="mt-ds-2 text-3xl font-bold text-text-primary">{companyName}</h1>
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

      <section className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card padding="md" interactive className="h-full">
              <p className="text-xl">{section.icon}</p>
              <p className="mt-ds-2 font-semibold text-text-primary">{section.title}</p>
              <p className="mt-ds-1 text-sm text-text-secondary">{section.description}</p>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
