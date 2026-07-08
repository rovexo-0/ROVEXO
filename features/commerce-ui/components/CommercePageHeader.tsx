import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type CommercePageHeaderProps = {
  title: string;
  backHref?: string;
  className?: string;
};

/** Centered-title header used by Order Details and Tracking screens. */
export function CommercePageHeader({ title, backHref = "/", className }: CommercePageHeaderProps) {
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

      <h1 className="flex-1 truncate text-center text-lg font-semibold text-text-primary">{title}</h1>

      {/* Symmetric spacer keeps the title optically centered. */}
      <span className="h-10 w-10 shrink-0" aria-hidden />
    </header>
  );
}
