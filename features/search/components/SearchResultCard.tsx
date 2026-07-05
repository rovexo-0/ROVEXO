"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { productToCardProps } from "@/lib/products/card";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import type { Product } from "@/lib/products/types";
import { highlightMatch } from "@/features/search/utils/highlight-match";

type SearchResultCardProps = {
  product: Product;
  query: string;
  elementId?: string;
  isActive?: boolean;
  onNavigate?: () => void;
  onHover?: () => void;
};

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.08 4.7 5.1.48a.56.56 0 0 1 .32.98l-3.86 3.4 1.13 5a.56.56 0 0 1-.83.6L12 16.5l-4.46 2.66a.56.56 0 0 1-.83-.6l1.13-5-3.86-3.4a.56.56 0 0 1 .32-.98l5.1-.48 2.08-4.7Z" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m9.6 16.2-3.3-3.3 1.4-1.4 1.9 1.9 5.9-5.9 1.4 1.4-7.3 7.3ZM12 2l2.4 1.8 3 .1 1 2.8 2.4 1.7-.9 2.9.9 2.9-2.4 1.7-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15.5l.9-2.9-.9-2.9 2.4-1.7 1-2.8 3-.1L12 2Z" />
    </svg>
  );
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.25c-.4 0-.79-.15-1.09-.42C6.14 15.6 3.5 13.2 3.5 9.9 3.5 7.4 5.42 5.5 7.85 5.5c1.4 0 2.74.66 3.6 1.7l.55.66.55-.66a4.66 4.66 0 0 1 3.6-1.7c2.43 0 4.35 1.9 4.35 4.4 0 3.3-2.64 5.7-7.41 9.93-.3.27-.69.42-1.09.42Z"
      />
    </svg>
  );
}

function formatPrice(value: number): string {
  return `£${value.toLocaleString("en-GB")}`;
}

function formatCondition(condition?: string): string | null {
  if (!condition?.trim()) return null;
  const clean = condition.replace(/[_-]+/g, " ").trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function SearchResultCard({
  product,
  query,
  elementId,
  isActive = false,
  onNavigate,
  onHover,
}: SearchResultCardProps) {
  const props = productToCardProps(product);
  const { isSaved, toggle, isPending } = useProductWatchlist(product.slug);
  const [imageLoaded, setImageLoaded] = useState(false);

  const condition = formatCondition(product.condition);
  const hasRating = product.reviewCount > 0 && product.rating > 0;
  const hasDiscount =
    typeof props.originalPrice === "number" && props.originalPrice > props.price;
  const breadcrumbs = product.categoryBreadcrumbs ?? [];

  return (
    <li
      id={elementId}
      role="option"
      aria-selected={isActive}
      onMouseEnter={onHover}
      className={cn(
        "rx-search-result-in group relative flex gap-3 rounded-2xl border border-border bg-surface p-3",
        "hover:border-primary/30 hover:shadow-ds-medium",
        transitionFast,
        isActive && "border-primary/40 shadow-ds-medium",
      )}
    >
      <Link
        href={props.href}
        aria-label={product.title}
        onClick={onNavigate}
        tabIndex={-1}
        className={cn("absolute inset-0 z-0 rounded-2xl", focusRing)}
      />

      <div className="pointer-events-none relative z-10 h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-surface-muted">
        <Image
          src={props.imageUrl}
          alt=""
          fill
          loading="lazy"
          sizes="72px"
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "object-cover transition-[opacity,transform] duration-500 ease-ds group-hover:scale-[1.05]",
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
        />
        {product.isFeatured ? (
          <span className="absolute bottom-1 left-1 rounded-full bg-accent px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wide text-white shadow-ds-soft">
            Featured
          </span>
        ) : null}
      </div>

      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate pr-8 text-[0.9375rem] font-semibold leading-snug text-text-primary">
          {highlightMatch(product.title, query)}
        </p>

        {breadcrumbs.length > 0 ? (
          <nav
            aria-label="Category path"
            className="pointer-events-auto flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[0.6875rem] leading-tight text-text-muted"
          >
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.id} className="inline-flex items-center gap-x-1">
                {index > 0 ? (
                  <span aria-hidden className="text-text-muted/50">
                    ›
                  </span>
                ) : null}
                <Link
                  href={crumb.href}
                  onClick={(event) => event.stopPropagation()}
                  className={cn(
                    "rounded-sm hover:text-primary hover:underline",
                    focusRing,
                    transitionFast,
                  )}
                >
                  {crumb.name}
                </Link>
              </span>
            ))}
          </nav>
        ) : condition ? (
          <p className="truncate text-xs text-text-secondary">{condition}</p>
        ) : null}

        <div className="mt-0.5 flex items-end justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar
              src={product.sellerAvatar}
              alt={product.sellerName}
              name={product.sellerName}
              size="sm"
            />
            <span className="min-w-0 truncate text-xs text-text-secondary">
              {highlightMatch(product.sellerName, query)}
            </span>
            {product.sellerVerified ? (
              <VerifiedIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : null}
            {hasRating ? (
              <span className="flex shrink-0 items-center gap-0.5 text-xs text-text-muted">
                <StarIcon className="h-3 w-3 text-warning" />
                <span className="font-medium text-text-secondary">
                  {product.rating.toFixed(1)}
                </span>
              </span>
            ) : null}
          </span>

          <span className="flex shrink-0 flex-col items-end leading-none">
            {hasDiscount ? (
              <span className="text-[0.6875rem] text-text-muted line-through">
                {formatPrice(props.originalPrice as number)}
              </span>
            ) : null}
            <span className="text-lg font-bold text-primary">{formatPrice(props.price)}</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label={isSaved ? "Remove from saved" : "Save item"}
        aria-pressed={isSaved}
        disabled={isPending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void toggle();
        }}
        className={cn(
          "pointer-events-auto absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full",
          "bg-surface/80 text-text-muted backdrop-blur hover:bg-secondary hover:text-primary",
          isSaved && "text-primary",
          focusRing,
          transitionFast,
        )}
      >
        <HeartIcon filled={isSaved} className="h-[18px] w-[18px]" />
      </button>
    </li>
  );
}
