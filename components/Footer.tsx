import Link from "next/link";
import { PlatformOperatorFooterNotice } from "@/components/legal/PlatformOperatorFooterNotice";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

const SUPPORT_LINKS = [
  { label: "Help center", href: "/help" },
  { label: "FAQ", href: "/help/faq" },
  { label: "Policies", href: "/help/policies" },
  { label: "AI assistant", href: "/assistant" },
  { label: "Trust Center", href: "/trust" },
  { label: "Resolution Centre", href: "/resolution" },
  { label: "Contact us", href: "/support" },
  { label: "Legal", href: "/legal" },
  { label: "Terms", href: "/help/terms-of-service" },
  { label: "Privacy", href: "/help/privacy-policy" },
];

const BUYER_LINKS = [
  { label: "Orders", href: "/orders" },
  { label: "Cart", href: "/cart" },
  { label: "Saved items", href: "/saved" },
  { label: "Categories", href: "/categories" },
  { label: "Search", href: "/search" },
];

const BUSINESS_LINKS = [
  { label: "Business Center", href: "/business/center" },
  { label: "Wholesale Center", href: "/wholesale" },
  { label: "Plans & Premium", href: "/plans" },
  { label: "Business dashboard", href: "/business/dashboard" },
  { label: "Business analytics", href: "/business/analytics" },
];

const SELL_LINKS = [
  { label: "Seller dashboard", href: "/seller/dashboard" },
  { label: "Sell an item", href: "/sell" },
  { label: "How to sell", href: "/help/selling-get-started" },
  { label: "Seller protection", href: "/help/buying-buyer-protection" },
  { label: "Shipping guide", href: "/help/delivery-shipping" },
];

function FooterLinkSection({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">{title}</h3>
      <ul className="mhub-footer-links-list mt-4 space-y-2.5 text-sm text-text-secondary">
        {links.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="hover:text-primary">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mhub-footer-section__grid">
        {links.map((item) => (
          <Link
            key={`mobile-${item.label}`}
            href={item.href}
            className={cn("mhub-footer-card", focusRing)}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6 lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground">
                R
              </div>
              <span className="text-xl font-extrabold tracking-tight text-text-primary">
                ROV<span className="text-primary">EXO</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              The modern marketplace to buy, sell, and discover pre-loved and new items across Europe.
            </p>
          </div>

          <FooterLinkSection title="Buy" links={BUYER_LINKS} />
          <FooterLinkSection title="Sell" links={SELL_LINKS} />
          <FooterLinkSection title="Business" links={BUSINESS_LINKS} />
          <FooterLinkSection title="Support" links={SUPPORT_LINKS} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8">
          <PlatformOperatorFooterNotice className="w-full" />
          <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-text-muted">
              © {new Date().getFullYear()} ROVEXO. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-text-muted">
              <span>EU Marketplace</span>
              <span>Secure payments</span>
              <span>Carbon-neutral shipping</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
