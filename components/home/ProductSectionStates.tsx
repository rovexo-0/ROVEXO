"use client";

import Link from "next/link";
import { ProductGridSkeleton } from "@/components/home/ProductGridSkeleton";

type ProductSectionEmptyProps = {
  title: string;
  message?: string;
};

export function ProductSectionEmpty({
  title,
  message = "Check back soon for new listings in this section.",
}: ProductSectionEmptyProps) {
  return (
    <div
      role="status"
      className="col-span-full rounded-ds-xl border border-dashed border-border bg-secondary/40 px-ds-5 py-ds-8 text-center"
    >
      <p className="text-sm font-medium text-text-primary">No {title.toLowerCase()} yet</p>
      <p className="mt-ds-1 text-sm text-text-secondary">{message}</p>
      <Link
        href="/categories"
        className="mt-ds-4 inline-flex min-h-ds-7 items-center rounded-ds-full bg-primary px-ds-5 text-sm font-semibold text-primary-foreground"
      >
        Browse categories
      </Link>
    </div>
  );
}

export function ProductSectionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="col-span-full rounded-ds-xl border border-danger/30 bg-danger/5 px-ds-5 py-ds-8 text-center"
    >
      <p className="text-sm font-medium text-text-primary">Unable to load products</p>
      <p className="mt-ds-1 text-sm text-text-secondary">Something went wrong. Please try again.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-ds-4 inline-flex min-h-ds-7 items-center rounded-ds-full bg-primary px-ds-5 text-sm font-semibold text-primary-foreground"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export { ProductGridSkeleton };
