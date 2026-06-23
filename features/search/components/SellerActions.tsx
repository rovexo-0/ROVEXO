import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm0 5.25h.007v.008H3.75V12Zm0 5.25h.007v.008H3.75v-.008Z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

const actionStyles = cn(
  "premium-chip inline-flex min-h-ds-7 flex-1 items-center justify-center gap-ds-2 px-ds-3 text-xs font-medium text-text-secondary sm:px-ds-4 sm:text-sm",
  transitionFast,
  focusRing,
);

export function SellerActions() {
  return (
    <div className="mt-ds-3 flex flex-wrap gap-ds-2">
      <Link href="/sell" aria-label="Create listing" className={cn(actionStyles, "text-text-primary")}>
        <PlusIcon className="h-5 w-5 shrink-0" />
        New listing
      </Link>
      <Link href="/seller/listings" aria-label="My listings" className={cn(actionStyles, "text-text-primary")}>
        <ListIcon className="h-5 w-5 shrink-0" />
        My listings
      </Link>
      <Link href="/seller/dashboard" aria-label="Seller dashboard" className={cn(actionStyles, "text-text-primary")}>
        <ChartIcon className="h-5 w-5 shrink-0" />
        Dashboard
      </Link>
    </div>
  );
}
