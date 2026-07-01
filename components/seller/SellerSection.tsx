"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type SellerSectionProps = {
  id: string;
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
  className?: string;
};

export function SellerSection({
  id,
  title,
  href,
  linkLabel = "View all",
  children,
  className,
}: SellerSectionProps) {
  return (
    <section className={cn("seller-section", className)} aria-labelledby={id}>
      <div className="seller-section__head">
        <h2 id={id} className="seller-section__title">
          {title}
        </h2>
        {href ? (
          <Link href={href} className="seller-section__link">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
