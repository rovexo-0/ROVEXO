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
    <div role="status" className="rx-home-empty">
      <p className="rx-home-empty__title">No {title.toLowerCase()} yet</p>
      <p className="rx-home-empty__message">{message}</p>
      <Link
        href="/categories"
        className="rx-home-empty__cta inline-flex min-h-ds-7 items-center rounded-ds-full bg-primary px-ds-5 text-sm font-semibold text-primary-foreground"
      >
        Browse categories
      </Link>
    </div>
  );
}

export function ProductSectionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rx-home-empty border-danger/50 bg-surface"
    >
      <p className="rx-home-empty__title">Unable to load products</p>
      <p className="rx-home-empty__message">Something went wrong. Please try again.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rx-home-empty__cta inline-flex min-h-ds-7 items-center rounded-ds-full bg-primary px-ds-5 text-sm font-semibold text-primary-foreground"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export { ProductGridSkeleton };
