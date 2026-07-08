import Link from "next/link";
import { Headphones } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type NeedHelpCardProps = {
  className?: string;
};

/** Help entry card shown at the bottom of the Tracking screen. */
export function NeedHelpCard({ className }: NeedHelpCardProps) {
  return (
    <Card padding="lg" className={cn("flex items-start gap-ds-3", className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-full bg-surface-muted text-text-secondary">
        <Headphones className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary">Need Help?</p>
        <p className="mt-ds-1 text-sm text-text-secondary">
          If you have any questions about your shipment, please visit our{" "}
          <Link href="/help" className="font-medium text-primary">
            Help Center
          </Link>
          .
        </p>
      </div>
    </Card>
  );
}
