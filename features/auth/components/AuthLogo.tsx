import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ROVEXO Home"
      className={cn(
        "mx-auto flex w-fit flex-col items-center gap-ds-3",
        focusRing,
        transitionFast,
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-ds-xl bg-surface shadow-ds-medium ring-1 ring-border/60">
        <img src="/logo-3d.png" alt="" className="h-11 w-11 object-contain" />
      </div>
      <span className="text-[1.75rem] font-bold tracking-tight text-text-primary">
        ROV<span className="text-primary">EXO</span>
      </span>
    </Link>
  );
}
