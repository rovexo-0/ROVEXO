import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LISTING_ATTRIBUTE_VALUE_V1 } from "@/lib/listing-attributes/listing-attribute-value-v1";
import styles from "@/components/listing/ListingAttributeValue.module.css";

type ListingAttributeValueProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

/**
 * Canonical right-side attribute value (Sell / Edit / View Item).
 * One typography — never duplicate or override per row.
 */
export function ListingAttributeValue({ children, className, id }: ListingAttributeValueProps) {
  return (
    <span
      id={id}
      className={cn("listing-attribute-value", styles["listing-attribute-value"], className)}
      data-listing-attribute-value={LISTING_ATTRIBUTE_VALUE_V1.version}
    >
      {children}
    </span>
  );
}
