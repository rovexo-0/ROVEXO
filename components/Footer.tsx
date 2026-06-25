import Link from "next/link";
import { PlatformOperatorFooterNotice } from "@/components/legal/PlatformOperatorFooterNotice";

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

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6 lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb] text-lg font-black text-white">
                R
              </div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900">
                ROV<span className="text-[#2563eb]">EXO</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
              The modern marketplace to buy, sell, and discover pre-loved and new items across Europe.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Buy</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
              {BUYER_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#2563eb]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Sell</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
              {SELL_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#2563eb]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Business</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
              {BUSINESS_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#2563eb]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Support</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-[#2563eb]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8">
          <PlatformOperatorFooterNotice className="w-full" />
          <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} ROVEXO. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-400">
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
