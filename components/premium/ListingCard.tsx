"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/products/types";
import { productToHref } from "@/components/premium/constants";

export type ListingCardVariant = "default" | "featured" | "new" | "boosted";

type ListingCardProps = {
  product: Product;
  variant?: ListingCardVariant;
  className?: string;
};

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function formatViews(views?: number): string | null {
  if (!views || views <= 0) return null;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k views`;
  return `${views} views`;
}

export function ListingCard({ product, variant = "default", className }: ListingCardProps) {
  const router = useRouter();
  const href = productToHref(product);
  const { isSaved, toggle, isPending } = useProductWatchlist(product.slug);
  const resolvedVariant =
    variant === "default"
      ? product.isBumped
        ? "boosted"
        : product.isFeatured
          ? "featured"
          : variant
      : variant;

  const viewsLabel = formatViews(product.views);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn(
        "premium-listing-card group relative flex w-[calc(50%-0.5rem)] shrink-0 flex-col overflow-hidden rounded-[1.35rem] border bg-white sm:w-[calc(25%-0.75rem)] lg:w-[calc(20%-0.8rem)]",
        resolvedVariant === "featured" &&
          "border-amber-200/80 shadow-[0_20px_50px_-24px_rgba(245,158,11,0.55)] ring-1 ring-amber-100",
        resolvedVariant === "new" && "border-emerald-200/70 shadow-[0_16px_40px_-22px_rgba(16,185,129,0.4)]",
        resolvedVariant === "boosted" &&
          "border-violet-300/70 shadow-[0_20px_50px_-20px_rgba(139,92,246,0.55)] animate-[premium-glow_3s_ease-in-out_infinite]",
        resolvedVariant === "default" && "border-slate-100 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.18)]",
        className,
      )}
    >
      <Link href={href} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-slate-50 to-white">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 18vw"
          />

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {resolvedVariant === "featured" && (
              <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                Featured
              </span>
            )}
            {resolvedVariant === "new" && (
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg animate-pulse">
                New
              </span>
            )}
            {resolvedVariant === "boosted" && (
              <span className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                Boost
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void toggle();
            }}
            className={cn(
              "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-500 shadow-md backdrop-blur-md transition hover:text-rose-500",
              isSaved && "text-rose-500",
            )}
          >
            <HeartIcon filled={isSaved} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{product.title}</p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">£{product.price.toLocaleString()}</span>
            {product.originalPrice && product.originalPrice > product.price ? (
              <span className="text-xs text-slate-400 line-through">£{product.originalPrice.toLocaleString()}</span>
            ) : null}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
            {product.sellerVerified ? (
              <span className="inline-flex items-center gap-1 font-medium text-violet-600">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            ) : null}
            {product.location ? <span>{product.location}</span> : null}
            {product.condition ? <span>· {product.condition}</span> : null}
            {viewsLabel ? <span>· {viewsLabel}</span> : null}
          </div>
        </div>
      </Link>

      <button
        type="button"
        className="sr-only"
        onClick={() => router.push(href)}
      >
        View {product.title}
      </button>
    </motion.article>
  );
}
