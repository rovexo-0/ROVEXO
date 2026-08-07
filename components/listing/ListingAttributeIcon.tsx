import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ListingAttributeIconProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Canonical attribute row icon slot — Master Icon System only (no local sizing).
 */
export function ListingAttributeIcon({ children, className }: ListingAttributeIconProps) {
  return (
    <span className={cn("cds-menu-row__icon", className)} data-listing-attribute-icon aria-hidden>
      {children}
    </span>
  );
}
