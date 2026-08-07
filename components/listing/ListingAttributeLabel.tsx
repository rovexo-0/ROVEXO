import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LISTING_ATTRIBUTE_LABEL_V1 } from "@/lib/listing-attributes/listing-attribute-label-v1";
import styles from "@/components/listing/ListingAttributeLabel.module.css";

const RECOMMENDED_SUFFIX = /\s*(\(recommended\))\s*$/i;

type ListingAttributeLabelProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

/**
 * Canonical left-side attribute label (Sell / Edit).
 * "(recommended)" keeps identical typography — opacity only.
 */
export function ListingAttributeLabel({ children, className, id }: ListingAttributeLabelProps) {
  let content: ReactNode = children;

  if (typeof children === "string") {
    const match = children.match(RECOMMENDED_SUFFIX);
    if (match && match.index != null) {
      const base = children.slice(0, match.index).trimEnd();
      const suffix = match[1];
      content = (
        <>
          {base}
          {base ? " " : null}
          <span className={styles["listing-attribute-label__suffix"]}>{suffix}</span>
        </>
      );
    }
  }

  return (
    <span
      id={id}
      className={cn("listing-attribute-label", styles["listing-attribute-label"], className)}
      data-listing-attribute-label={LISTING_ATTRIBUTE_LABEL_V1.version}
    >
      {content}
    </span>
  );
}
