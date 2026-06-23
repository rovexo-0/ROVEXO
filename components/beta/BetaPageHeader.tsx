import Link from "next/link";
import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { StickyPageHeader } from "@/components/ui/StickyPageHeader";

type BetaPageHeaderProps = {
  title: string;
  backHref?: string;
  className?: string;
};

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

export function BetaPageHeader({ title, backHref = "/", className }: BetaPageHeaderProps) {
  return (
    <StickyPageHeader className={className}>
      <div className="flex items-center gap-ds-3 px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
        <IconButton href={backHref} label="Go back" variant="ghost" size="md">
          <BackIcon className="h-5 w-5" />
        </IconButton>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-text-primary">{title}</h1>
      </div>
    </StickyPageHeader>
  );
}

export function BetaPageHeaderLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-primary">
      {children}
    </Link>
  );
}
