import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 8.813 4.5h6.374a2.31 2.31 0 0 1 2.006 1.175l1.015 1.8A2.31 2.31 0 0 0 20.25 8.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18V8.25c0-.994.627-1.881 1.566-2.212l1.511-.863Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

const actionStyles = cn(
  "inline-flex min-h-ds-7 flex-1 items-center justify-center gap-ds-2 rounded-ds-full border border-border bg-surface px-ds-3 text-xs font-medium text-text-secondary sm:px-ds-4 sm:text-sm",
  transitionFast,
  focusRing,
);

export function SellerActions() {
  return (
    <div className="mt-ds-3 flex flex-wrap gap-ds-2">
      <Link href="/sell" aria-label="AI Camera" className={cn(actionStyles, "text-text-primary")}>
        <CameraIcon className="h-5 w-5 shrink-0" />
        AI Camera
      </Link>
      <button type="button" disabled aria-label="AI Description — Beta planned" className={actionStyles}>
        <SparklesIcon className="h-5 w-5 shrink-0" />
        AI Description
      </button>
      <button type="button" disabled aria-label="AI Price Suggestion — Beta planned" className={actionStyles}>
        <TagIcon className="h-5 w-5 shrink-0" />
        AI Price
      </button>
    </div>
  );
}
