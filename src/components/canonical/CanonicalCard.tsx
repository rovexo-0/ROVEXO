import type { HTMLAttributes, ReactNode } from "react";
import { cdsCardClass } from "./utils";
import type { CanonicalCardVariant } from "./tokens";

export type CanonicalCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CanonicalCardVariant;
  children: ReactNode;
};

/**
 * Canonical card — one surface system for all modules.
 */
export function CanonicalCard({
  variant = "medium",
  className,
  children,
  ...props
}: CanonicalCardProps) {
  return (
    <div className={cdsCardClass(variant, className)} {...props}>
      {children}
    </div>
  );
}
