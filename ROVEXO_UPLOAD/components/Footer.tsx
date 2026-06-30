import Link from "next/link";
import { PlatformOperatorFooterNotice } from "@/components/legal/PlatformOperatorFooterNotice";
import { LEGAL_SUPPORT_EMAIL } from "@/lib/legal/content";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

const FOOTER_LINKS = [
  { label: "About", href: "/legal" },
  { label: "Contact", href: "/support" },
  { label: "Privacy", href: "/help/privacy-policy" },
  { label: "Terms", href: "/help/terms-of-service" },
  { label: "Legal", href: "/legal" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--ds-glass-bg)] shadow-[var(--ds-shadow-soft)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-ds-4 py-ds-7 sm:px-ds-6 lg:px-ds-8 lg:py-ds-9">
        <div className="max-w-md">
          <Link href="/" className="flex items-center gap-ds-3">
            <div className="rx-glass rx-depth-2 flex h-10 w-10 items-center justify-center rounded-ds-lg bg-[image:var(--ds-gradient-primary)] text-lg font-black text-primary-foreground">
              R
            </div>
            <span className="text-title text-xl font-extrabold tracking-tight text-text-primary">
              ROV<span className="text-primary">EXO</span>
            </span>
          </Link>
          <p className="text-body mt-ds-4 max-w-xs text-text-secondary">
            The modern marketplace to buy, sell, and discover pre-loved and new items across Europe.
          </p>
          <p className="mt-3 text-sm text-text-secondary">
            <Link href={`mailto:${LEGAL_SUPPORT_EMAIL}`} className="hover:text-primary hover:underline">
              {LEGAL_SUPPORT_EMAIL}
            </Link>
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8">
          <PlatformOperatorFooterNotice className="w-full" />
          <nav aria-label="Footer" className="flex w-full flex-wrap justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn("text-sm text-text-secondary hover:text-primary", focusRing)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
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
