import Link from "next/link";
import { Headphones } from "lucide-react";
import { CanonicalCard } from "@/src/components/canonical";
import { cn } from "@/lib/cn";

type NeedHelpCardProps = {
  className?: string;
};

/** Help entry card shown at the bottom of the Tracking screen. */
export function NeedHelpCard({ className }: NeedHelpCardProps) {
  return (
    <CanonicalCard variant="small" className={cn("flex w-full items-start gap-ds-2", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ds-full bg-surface-muted text-text-secondary">
        <Headphones className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary">Need help?</p>
        <p className="text-sm text-text-secondary">
          Visit the{" "}
          <Link href="/help" className="font-medium text-primary">
            Help Center
          </Link>
          .
        </p>
      </div>
    </CanonicalCard>
  );
}
