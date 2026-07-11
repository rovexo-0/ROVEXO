import Link from "next/link";
import { HelpTextCard } from "@/features/help/components/HelpQuickLinks";

export const CANONICAL_HELP_LINKS = [
  { href: "/help/category/buyer", title: "Buying", description: "Checkout, orders, and purchase help" },
  { href: "/help/category/seller", title: "Selling", description: "Listings, payouts, and seller tools" },
  { href: "/help/category/shipping", title: "Shipping", description: "Delivery methods and tracking" },
  { href: "/help/category/payments", title: "Payments", description: "Cards, wallet, and fees" },
  { href: "/wallet", title: "Wallet", description: "Balance, withdrawals, and statements" },
  { href: "/help/category/returns", title: "Returns", description: "Returns and refunds" },
  { href: "/orders", title: "Orders", description: "Track bought and sold orders" },
  { href: "/help/category/safety", title: "Safety", description: "Trust, scams, and reporting" },
  { href: "/legal/platform-fee-policy", title: "Platform Fees", description: "Fees, pricing, and deductions" },
  {
    href: "/legal/digital-platform-reporting-tax-notice",
    title: "Tax & Reporting",
    description: "Seller tax profile and HMRC records",
  },
  { href: "/support", title: "Contact Support", description: "Subject, message, and screenshot" },
  { href: "/legal/terms-and-conditions", title: "Terms", description: "ROVEXO terms and conditions" },
  { href: "/legal/privacy-policy", title: "Privacy Policy", description: "Privacy policy" },
  { href: "/legal/cookie-policy", title: "Cookie Policy", description: "Cookies and similar technologies" },
] as const;

export function HelpCentreCanonicalSection() {
  return (
    <section aria-label="Help Centre topics" className="mhub-section" data-help-centre-version="v1.0-legal-lock">
      <h2 className="mhub-section__title">Help Centre</h2>
      <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
        {CANONICAL_HELP_LINKS.map((item) => (
          <HelpTextCard key={`${item.href}-${item.title}`} href={item.href} title={item.title} description={item.description} />
        ))}
      </div>
      <p className="mt-ds-4 text-sm text-text-secondary">
        App version{" "}
        <Link href="/account/settings/about" className="font-medium text-primary">
          ROVEXO
        </Link>
      </p>
    </section>
  );
}
