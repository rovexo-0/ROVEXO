"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/variants";

export type PaginationProps = {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  className?: string;
};

export function Pagination({ page, totalPages, hrefForPage, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-ds-3", className)}>
      {page <= 1 ? (
        <span className={cn(buttonVariants.secondary, "pointer-events-none opacity-50")}>Previous</span>
      ) : (
        <Link href={hrefForPage(prev)} className={buttonVariants.secondary}>
          Previous
        </Link>
      )}
      <span className="text-caption text-text-secondary">
        Page {page} of {totalPages}
      </span>
      {page >= totalPages ? (
        <span className={cn(buttonVariants.secondary, "pointer-events-none opacity-50")}>Next</span>
      ) : (
        <Link href={hrefForPage(next)} className={buttonVariants.secondary}>
          Next
        </Link>
      )}
    </nav>
  );
}
