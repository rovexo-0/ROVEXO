import Link from "next/link";
import { PlatformOperatorFooterNotice } from "@/components/legal/PlatformOperatorFooterNotice";
import { LEGAL_SUPPORT_EMAIL } from "@/lib/legal/content";

const FOOTER_LINKS = [
  { label: "About", href: "/legal" },
  { label: "Contact", href: "/support" },
  { label: "Privacy", href: "/help/privacy-policy" },
  { label: "Terms", href: "/help/terms-of-service" },
] as const;

export function PremiumFooter() {
  return (
    <footer className="premium-footer border-t border-slate-100 bg-white">
      <div className="premium-container py-12 lg:py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-black text-white shadow-lg">
                R
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                ROV<span className="text-violet-600">EXO</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              The premium marketplace to buy, sell, and discover trusted deals across Europe.
            </p>
            <a href={`mailto:${LEGAL_SUPPORT_EMAIL}`} className="mt-3 inline-block text-sm text-violet-600 hover:underline">
              {LEGAL_SUPPORT_EMAIL}
            </a>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition hover:text-violet-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-8">
          <PlatformOperatorFooterNotice className="mb-4" />
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} ROVEXO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default PremiumFooter;
