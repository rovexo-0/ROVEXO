import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { cn } from "@/lib/cn";

type AccountPageShellProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  className?: string;
};

export function AccountPageShell({
  title,
  subtitle,
  backHref = "/account",
  backLabel = "Account",
  children,
  className,
}: AccountPageShellProps) {
  return (
    <BetaAppShell showBottomNav={false}>
      <main
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-col gap-ds-6 px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]",
          className,
        )}
      >
        <div>
          <Link href={backHref} className="text-sm font-medium text-primary hover:underline">
            ← {backLabel}
          </Link>
          <h1 className="mt-ds-3 text-2xl font-bold text-text-primary">{title}</h1>
          {subtitle ? <p className="mt-ds-1 text-sm text-text-secondary">{subtitle}</p> : null}
        </div>
        {children}
      </main>
    </BetaAppShell>
  );
}
