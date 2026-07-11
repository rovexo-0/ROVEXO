import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export type RovexoWordmarkProps = {
  className?: string;
  /** When true, renders as a home link. */
  asLink?: boolean;
};

/** Official ROVEXO wordmark — ROVE black, X #7C3AED, O black. No effects. */
export function RovexoWordmark({ className, asLink = false }: RovexoWordmarkProps) {
  const mark = (
    <span className={cn("rx-wordmark", className)} aria-label="ROVEXO">
      <span className="rx-wordmark__rove" aria-hidden>
        ROVE
      </span>
      <span className="rx-wordmark__x" aria-hidden>
        X
      </span>
      <span className="rx-wordmark__o" aria-hidden>
        O
      </span>
    </span>
  );

  if (!asLink) return mark;

  return (
    <Link href="/" aria-label="ROVEXO Home" className={cn("rx-wordmark-link", focusRing)}>
      {mark}
    </Link>
  );
}
