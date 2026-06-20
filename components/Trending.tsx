import Image from "next/image";
import Link from "next/link";

export type TrendingListing = {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  condition: string;
  sellerName: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  trendLabel?: string;
};

type TrendingProps = {
  listings?: TrendingListing[];
};

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.753-.382-1.831-4.401Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function TrendingCard({ listing }: { listing: TrendingListing }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/listing/${listing.slug}`} className="relative block aspect-square overflow-hidden bg-gray-50">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {listing.trendLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white">
            {listing.trendLabel}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link href={`/listing/${listing.slug}`} className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 hover:text-[#2563eb]">
          {listing.title}
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">€{listing.price.toFixed(2)}</span>
          {listing.originalPrice != null && (
            <span className="text-sm text-gray-400 line-through">
              €{listing.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <StarIcon className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-medium text-gray-700">{listing.rating.toFixed(1)}</span>
          <span>({listing.reviewCount})</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-1 text-xs">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
            {listing.condition}
          </span>
          <span className="truncate text-gray-500">{listing.sellerName}</span>
        </div>
        <button
          type="button"
          aria-label={`Save ${listing.title}`}
          className="mt-2 flex h-9 w-9 items-center justify-center self-end rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-red-200 hover:text-red-500"
        >
          <HeartIcon className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}

export default function Trending({ listings = [] }: TrendingProps) {
  return (
    <section className="bg-gray-50 py-10 sm:py-14 lg:py-16" aria-labelledby="trending-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="trending-heading" className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Trending now
            </h2>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              Most viewed items in the last 24 hours
            </p>
          </div>
          <Link href="/trending" className="text-sm font-semibold text-[#2563eb] hover:opacity-80">
            See trending →
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:gap-6">
            {listings.map((listing) => (
              <TrendingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-sm text-gray-500">Trending listings will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
