import type { ReactNode } from "react";
import { cdsInfoBlockClass } from "./utils";
import type { CanonicalInfoBlockVariant } from "./tokens";

export type CanonicalInfoBlockProps = {
  variant?: CanonicalInfoBlockVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Canonical info block — info, success, error, warning, description, tip.
 */
export function CanonicalInfoBlock({
  variant = "info",
  title,
  children,
  className,
}: CanonicalInfoBlockProps) {
  return (
    <div className={cdsInfoBlockClass(variant, className)} role="status">
      {title ? <p className="cds-info-block__title">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
