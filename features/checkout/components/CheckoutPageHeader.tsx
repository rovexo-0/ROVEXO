import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";

type CheckoutPageHeaderProps = {
  backHref: string;
};

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

export function CheckoutPageHeader({ backHref }: CheckoutPageHeaderProps) {
  return (
    <header className="premium-page-header sticky top-0 z-50">
      <div
        className={cn(
          "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
          "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
        )}
      >
        <IconButton href={backHref} label="Go back" variant="ghost" size="md" className="justify-self-start">
          <BackIcon className="h-5 w-5" />
        </IconButton>

        <h1 className="truncate text-center text-lg font-semibold text-text-primary">Checkout</h1>

        <span aria-hidden className="w-12" />
      </div>
    </header>
  );
}
