import Link from "next/link";
import { PlatformOperatorFooterNotice } from "@/components/legal/PlatformOperatorFooterNotice";

const FOOTER_LINKS = [
  { label: "About", href: "/legal" },
  { label: "Contact", href: "/support" },
  { label: "Privacy", href: "/help/privacy-policy" },
  { label: "Terms", href: "/help/terms-of-service" },
  { label: "Legal", href: "/legal" },
] as const;

export function PremiumFooter() {
  return (
    <footer className="border-t border-[#f1f1f1] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <PlatformOperatorFooterNotice className="w-full text-center" />
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#666666] transition hover:text-[#2563eb]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export default PremiumFooter;
