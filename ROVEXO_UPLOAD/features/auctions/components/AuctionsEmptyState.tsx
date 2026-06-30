"use client";

import Link from "next/link";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export function AuctionsEmptyState({ className }: { className?: string }) {
  return (
    <div className={cn("auctions-empty mx-ds-4", className)}>
      <span className="text-4xl" aria-hidden>
        🏆
      </span>
      <div>
        <p className="text-lg font-bold text-text-primary">No auctions available yet.</p>
        <p className="mt-1 text-sm text-text-secondary">
          Be the first seller to launch an auction.
        </p>
      </div>
      <Link
        href="/sell/auction"
        className={cn(
          "inline-flex items-center justify-center",
          buttonVariants.primary,
          buttonSizes.lg,
          "auctions-btn-gradient min-h-12 border-0 px-8 text-primary-foreground",
          focusRing,
        )}
      >
        Start Selling
      </Link>
    </div>
  );
}
