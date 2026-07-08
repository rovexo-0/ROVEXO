import { cn } from "@/lib/cn";

/**
 * Canonical ROVEXO wordmark for commerce headers — only the letter "X" uses
 * ROVEXO Purple; everything else follows the primary text color.
 */
export function CommerceWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("font-extrabold tracking-tight text-text-primary", className)}
      aria-label="ROVEXO"
    >
      ROV<span className="text-primary">X</span>O
    </span>
  );
}
