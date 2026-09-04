import Link from "next/link";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import { focusRing, transitionFast } from "@/components/ui/tokens";

const actionStyles = cn(
  "rx-chip inline-flex min-h-ds-7 flex-1 items-center justify-center gap-ds-2 px-ds-3 text-xs font-medium text-text-secondary sm:px-ds-4 sm:text-sm",
  transitionFast,
  focusRing,
);

export function SellerActions() {
  return (
    <div className="mt-ds-3 flex flex-wrap gap-ds-2">
      <Link href="/sell" aria-label="Create listing" className={cn(actionStyles, "text-text-primary")}>
        <PlatformEmoji emoji={PLATFORM_EMOJI.plus} size={20} className="h-5 w-5 shrink-0" />
        New listing
      </Link>
      <Link href="/seller/listings" aria-label="My listings" className={cn(actionStyles, "text-text-primary")}>
        <PlatformEmoji emoji={PLATFORM_EMOJI.listings} size={20} className="h-5 w-5 shrink-0" />
        My listings
      </Link>
      <Link href="/seller" aria-label="Selling workspace" className={cn(actionStyles, "text-text-primary")}>
        <PlatformEmoji emoji={PLATFORM_EMOJI.analytics} size={20} className="h-5 w-5 shrink-0" />
        Selling
      </Link>
    </div>
  );
}
