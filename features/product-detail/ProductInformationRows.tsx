"use client";

import { memo } from "react";
import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { ListingAttributeValue } from "@/components/listing/ListingAttributeValue";

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
 * Values use ListingAttributeValue (Attribute Engine typography SSOT).
 * Category / Brand may be links; value typography stays identical.
 */
export const ProductInformationRows = memo(function ProductInformationRows({ rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <section className="pd-v1__info" aria-label="Product information" data-product-info-rows>
      <ul className="pd-v1__info-list">
        {rows.map((row) => {
          const clickable = Boolean(row.href);

          const inner = (
            <>
              <span className="pd-v1__info-label">{row.label}</span>
              <span className="pd-v1__info-trailing">
                <ListingAttributeValue>{row.value}</ListingAttributeValue>
                {clickable ? (
                  <span className="pd-v1__info-chevron" aria-hidden>
                    <ChevronRightLineIcon />
                  </span>
                ) : null}
              </span>
            </>
          );

          return (
            <li key={row.id} className="pd-v1__info-row" data-row-id={row.id}>
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
});
