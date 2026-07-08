import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export function HomepageV3Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ROVEXO Home"
      className={cn("hp3-wordmark", focusRing, transitionFast, className)}
    >
      <svg viewBox="0 0 108 20" width="108" height="20" aria-hidden xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="16" fill="currentColor" fontSize="17" fontWeight="800" letterSpacing="-0.04em">
          ROV
        </text>
        <text x="44" y="16" fill="var(--ds-color-primary)" fontSize="17" fontWeight="800" letterSpacing="-0.04em">
          X
        </text>
        <text x="56" y="16" fill="currentColor" fontSize="17" fontWeight="800" letterSpacing="-0.04em">
          O
        </text>
      </svg>
    </Link>
  );
}
