"use client";

import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";

export type ProductInfoRow = {
  id: string;
  label: string;
  value: string;
  href?: string | null;
  valueTone?: "default" | "primary" | "success";
};

type Props = {
  rows: readonly ProductInfoRow[];
};

/**
 * Product Information — 56px rows, 1px dividers.
 * Category / Brand may be links; other rows read-only.
 */
export function ProductInformationRows({ rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <section className="pd-v1__info" aria-label="Product information" data-product-info-rows>
      <ul className="pd-v1__info-list">
        {rows.map((row) => {
          const clickable = Boolean(row.href);
          const valueClass = cn(
            "pd-v1__info-value",
            row.valueTone === "primary" && "pd-v1__info-value--primary",
            row.valueTone === "success" && "pd-v1__info-value--success",
            clickable && "pd-v1__info-value--link",
          );

          const inner = (
            <>
              <span className="pd-v1__info-label">{row.label}</span>
              <span className="pd-v1__info-trailing">
                <span className={valueClass}>{row.value}</span>
                {clickable ? (
                  <span className="pd-v1__info-chevron" aria-hidden>
                    <ChevronRightLineIcon />
                  </span>
                ) : null}
              </span>
            </>
          );

          return (
            <li key={row.id} className="pd-v1__info-row">
              {clickable ? (
                <Link href={row.href!} className="pd-v1__info-row-btn" aria-label={`${row.label}: ${row.value}`}>
                  {inner}
                </Link>
              ) : (
                <div className="pd-v1__info-row-btn" role="group" aria-label={`${row.label}: ${row.value}`}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
