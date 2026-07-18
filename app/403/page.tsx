import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { ForbiddenBackButton } from "@/components/errors/ForbiddenBackButton";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-[70dvh] w-full max-w-none flex-col items-center justify-center px-ds-4 py-ds-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">403</p>
      <h1 className="mt-ds-2 text-2xl font-bold text-text-primary">Access denied</h1>
      <p className="mt-ds-3 text-sm text-text-secondary">
        You do not have permission to view this page. Super Admin areas are restricted to authorised
        platform accounts only.
      </p>
      <div className="mt-ds-6 flex flex-wrap justify-center gap-ds-3">
        <ForbiddenBackButton />
        <Link
          href="/"
          className={cn(
            "inline-flex min-h-ds-7 items-center justify-center rounded-ds-md bg-primary px-ds-4 text-sm font-semibold text-primary-foreground",
            focusRing,
          )}
        >
          Back to marketplace
        </Link>
        <Link
          href="/account"
          className={cn(
            "inline-flex min-h-ds-7 items-center justify-center rounded-ds-md border border-border bg-surface px-ds-4 text-sm font-semibold text-text-primary",
            focusRing,
          )}
        >
          My account
        </Link>
      </div>
    </main>
  );
}
