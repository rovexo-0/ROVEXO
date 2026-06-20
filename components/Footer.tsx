import Link from "next/link";

const footerLinks = {
  shop: ["Women", "Men", "Kids", "Electronics", "Home"],
  sell: ["How to sell", "Seller protection", "Shipping guide", "Pricing tips"],
  company: ["About us", "Careers", "Press", "Sustainability", "Blog"],
  support: ["Help center", "Contact us", "Trust & safety", "Terms", "Privacy"],
};

const socialLinks = [
  { label: "X", href: "https://x.com" },
  { label: "in", href: "https://linkedin.com" },
  { label: "ig", href: "https://instagram.com" },
  { label: "fb", href: "https://facebook.com" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-10">
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
              The modern marketplace to buy, sell, and discover pre-loved and new
              items across Europe.
            </p>
            <div className="mt-6 flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-bold text-gray-600 shadow-sm transition-colors hover:text-[#2563eb]"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Shop</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
              {footerLinks.shop.map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-[#2563eb]">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Sell</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
              {footerLinks.sell.map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-[#2563eb]">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Company</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
              {footerLinks.company.map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-[#2563eb]">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Support</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
              {footerLinks.support.map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-[#2563eb]">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} ROVEXO. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-400">
            <span>EU Marketplace</span>
            <span>Secure payments</span>
            <span>Carbon-neutral shipping</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
