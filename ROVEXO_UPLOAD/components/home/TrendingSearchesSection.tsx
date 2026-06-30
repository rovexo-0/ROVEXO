import Link from "next/link";
import { defaultTrendingSearches } from "@/lib/search/defaults";

type TrendingSearchesSectionProps = {
  searches?: string[];
};

export function TrendingSearchesSection({
  searches = defaultTrendingSearches,
}: TrendingSearchesSectionProps) {
  return (
    <section aria-labelledby="trending-searches-heading" className="px-ds-4">
      <h2 id="trending-searches-heading" className="mb-ds-3 text-lg font-semibold text-text-primary">
        Trending
      </h2>
      <ul className="flex flex-wrap gap-ds-2">
        {searches.map((term) => (
          <li key={term}>
            <Link
              href={`/search?q=${encodeURIComponent(term)}`}
              className="rx-chip inline-flex min-h-ds-7 items-center px-ds-4 text-sm font-medium text-text-secondary hover:text-primary"
            >
              {term}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
