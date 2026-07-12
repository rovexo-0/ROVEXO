import { cn } from "@/lib/cn";

export type CanonicalDividerProps = {
  className?: string;
  /** When true, divider spans edge-to-edge inside padded containers. */
  inset?: boolean;
};

/**
 * Canonical divider — consistent section separators.
 */
export function CanonicalDivider({ className, inset = false }: CanonicalDividerProps) {
  return <hr className={cn("cds-divider", inset && "cds-divider--inset", className)} />;
}
