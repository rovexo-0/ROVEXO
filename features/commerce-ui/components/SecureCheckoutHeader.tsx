import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { CommerceWordmark } from "@/features/commerce-ui/components/CommerceWordmark";

type SecureCheckoutHeaderProps = {
  backHref?: string;
  className?: string;
};

/** Checkout header: back control, centered ROVEXO wordmark, secure-checkout mark. */
export function SecureCheckoutHeader({ backHref = "/cart", className }: SecureCheckoutHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center gap-ds-2 border-b border-border bg-surface/90 px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))] backdrop-blur",
        className,
      )}
    >
      <Link
        href={backHref}
        aria-label="Go back"
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-full text-text-primary hover:bg-surface-muted",
          focusRing,
          transitionFast,
        )}
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <CommerceWordmark className="flex-1 text-center text-lg" />

      <span className="inline-flex shrink-0 items-center gap-ds-1 text-xs font-medium text-text-secondary">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="hidden min-[380px]:inline">Secure Checkout</span>
      </span>
    </header>
  );
}
