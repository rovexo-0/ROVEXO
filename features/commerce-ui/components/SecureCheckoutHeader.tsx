import Link from "next/link";
import { AccountIcon } from "@/components/account/AccountIcons";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { CommerceWordmark } from "@/features/commerce-ui/components/CommerceWordmark";

type SecureCheckoutHeaderProps = {
  backHref?: string;
  className?: string;
};

/** Checkout header — One Product (no glass / lucide). */
export function SecureCheckoutHeader({ backHref = "/cart", className }: SecureCheckoutHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center gap-ds-2 border-b border-border bg-white px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]",
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
        <span className="text-xl leading-none" aria-hidden>
          ‹
        </span>
      </Link>

      <CommerceWordmark className="flex-1 text-center text-lg" />

      <span className="inline-flex shrink-0 items-center gap-ds-1 text-xs font-medium text-text-secondary">
        <span className="ac-canonical__menu-icon text-primary" aria-hidden>
          <AccountIcon name="security" />
        </span>
        <span className="hidden min-[380px]:inline">Secure Checkout</span>
      </span>
    </header>
  );
}
