"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type BuyerSectionProps = {
  id: string;
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
  className?: string;
};

export function BuyerSection({
  id,
  title,
  href,
  linkLabel = "View all",
  children,
  className,
}: BuyerSectionProps) {
  return (
    <section className={cn("buyer-section", className)} aria-labelledby={id}>
      <div className="buyer-section__head">
        <h2 id={id} className="buyer-section__title">
          {title}
        </h2>
        {href ? (
          <Link href={href} className="buyer-section__link">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
